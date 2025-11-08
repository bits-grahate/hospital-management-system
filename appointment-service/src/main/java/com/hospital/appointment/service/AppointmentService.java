package com.hospital.appointment.service;

import com.hospital.appointment.dto.AppointmentDTO;
import com.hospital.appointment.dto.RescheduleRequest;
import com.hospital.appointment.model.Appointment;
import com.hospital.appointment.model.Appointment.AppointmentStatus;
import com.hospital.appointment.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Timer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentService {
    private final AppointmentRepository appointmentRepository;
    private final WebClient.Builder webClientBuilder;
    private final Counter appointmentsCreatedCounter;
    private final Counter appointmentsCancelledCounter;
    private final Counter appointmentsRescheduledCounter;
    private final Timer appointmentBookingLatency;
    
    @Transactional
    public AppointmentDTO bookAppointment(AppointmentDTO appointmentDTO, String correlationId) {
        log.info("Booking appointment for patient {} with doctor {}", 
                 appointmentDTO.getPatientId(), appointmentDTO.getDoctorId());
        
        return appointmentBookingLatency.record(() -> {
            return doBookAppointment(appointmentDTO, correlationId);
        });
    }
    
    @Transactional
    private AppointmentDTO doBookAppointment(AppointmentDTO appointmentDTO, String correlationId) {
        // Validate slot times: slotEnd must be after slotStart
        if (appointmentDTO.getSlotEnd().isBefore(appointmentDTO.getSlotStart()) || 
            appointmentDTO.getSlotEnd().isEqual(appointmentDTO.getSlotStart())) {
            throw new RuntimeException("Slot end time must be after slot start time");
        }
        
        // Check patient exists and is active
        Boolean patientActive = webClientBuilder.build()
            .get()
            .uri("http://patient-service:8001/v1/patients/{patientId}", appointmentDTO.getPatientId())
            .retrieve()
            .bodyToMono(Map.class)
            .map(response -> true)
            .onErrorReturn(false)
            .block();
        
        if (!patientActive) {
            throw new RuntimeException("Patient not found or inactive");
        }
        
        // Check doctor exists and department match
        Map<String, Object> doctor = webClientBuilder.build()
            .get()
            .uri("http://doctor-service:8002/v1/doctors/{doctorId}", appointmentDTO.getDoctorId())
            .retrieve()
            .bodyToMono(Map.class)
            .block();
        
        if (doctor == null) {
            throw new RuntimeException("Doctor not found");
        }
        
        if (!appointmentDTO.getDepartment().equals(doctor.get("department"))) {
            throw new RuntimeException("Department mismatch: Doctor belongs to " + doctor.get("department"));
        }
        
        // Check slot availability
        Map<String, Object> availabilityCheck = Map.of(
            "department", appointmentDTO.getDepartment(),
            "slotStart", appointmentDTO.getSlotStart().toString(),
            "slotEnd", appointmentDTO.getSlotEnd().toString()
        );
        
        Map<String, Object> availability = webClientBuilder.build()
            .post()
            .uri("http://doctor-service:8002/v1/doctors/{doctorId}/check-availability", 
                 appointmentDTO.getDoctorId())
            .bodyValue(availabilityCheck)
            .retrieve()
            .bodyToMono(Map.class)
            .block();
        
        if (availability == null || !Boolean.TRUE.equals(availability.get("available"))) {
            String message = (String) availability.getOrDefault("message", availability.getOrDefault("reason", "Slot not available"));
            throw new RuntimeException("Slot not available: " + message);
        }
        
        // Check no overlap for same doctor
        List<Appointment> overlappingDoctor = appointmentRepository.findOverlappingAppointmentsForDoctor(
            appointmentDTO.getDoctorId(),
            appointmentDTO.getSlotStart(),
            appointmentDTO.getSlotEnd()
        );
        if (!overlappingDoctor.isEmpty()) {
            throw new RuntimeException("Slot overlaps with existing appointment for doctor");
        }
        
        // Check max 1 active appointment per patient per overlapping time slot
        List<Appointment> overlappingPatient = appointmentRepository.findOverlappingAppointmentsForPatient(
            appointmentDTO.getPatientId(),
            appointmentDTO.getSlotStart(),
            appointmentDTO.getSlotEnd()
        );
        if (!overlappingPatient.isEmpty()) {
            throw new RuntimeException("Patient already has an appointment in this time slot");
        }
        
        // Create appointment
        Appointment appointment = new Appointment();
        appointment.setPatientId(appointmentDTO.getPatientId());
        appointment.setDoctorId(appointmentDTO.getDoctorId());
        appointment.setDepartment(appointmentDTO.getDepartment());
        appointment.setSlotStart(appointmentDTO.getSlotStart());
        appointment.setSlotEnd(appointmentDTO.getSlotEnd());
        appointment.setStatus(AppointmentStatus.SCHEDULED);
        appointment.setRescheduleCount(0);
        
        appointment = appointmentRepository.save(appointment);
        log.info("Appointment booked - ID: {}", appointment.getAppointmentId());
        
        // Record metrics
        appointmentsCreatedCounter.increment();
        
        // Send notification
        sendNotification(appointment, "BOOKED", correlationId);
        
        return toDTO(appointment);
    }
    
    @Transactional
    public AppointmentDTO rescheduleAppointment(Long appointmentId, RescheduleRequest request, String correlationId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Appointment not found"));
        
        // Check max 2 reschedules
        if (appointment.getRescheduleCount() >= 2) {
            throw new RuntimeException("Maximum reschedule limit (2) reached");
        }
        
        // Check cut-off: cannot reschedule within 1 hour of original appointment start
        LocalDateTime now = LocalDateTime.now();
        long hoursUntilOriginalStart = ChronoUnit.HOURS.between(now, appointment.getSlotStart());
        if (hoursUntilOriginalStart < 1) {
            throw new RuntimeException("Cannot reschedule within 1 hour of appointment start");
        }
        
        // Check new slot lead time: must be at least 2 hours from now (same as booking)
        long hoursUntilNewStart = ChronoUnit.HOURS.between(now, request.getNewSlotStart());
        if (hoursUntilNewStart < 2) {
            throw new RuntimeException("New appointment slot must be at least 2 hours from now");
        }
        
        // Check doctor availability
        Map<String, Object> availabilityCheck = Map.of(
            "slotStart", request.getNewSlotStart().toString(),
            "slotEnd", request.getNewSlotEnd().toString()
        );
        
        Map<String, Object> availability = webClientBuilder.build()
            .post()
            .uri("http://doctor-service:8002/v1/doctors/{doctorId}/check-availability", 
                 appointment.getDoctorId())
            .bodyValue(availabilityCheck)
            .retrieve()
            .bodyToMono(Map.class)
            .block();
        
        if (availability == null || !Boolean.TRUE.equals(availability.get("available"))) {
            String message = (String) availability.getOrDefault("message", availability.getOrDefault("reason", "New slot not available"));
            throw new RuntimeException("New slot not available: " + message);
        }
        
        // Validate new slot times: slotEnd must be after slotStart
        if (request.getNewSlotEnd().isBefore(request.getNewSlotStart()) || 
            request.getNewSlotEnd().isEqual(request.getNewSlotStart())) {
            throw new RuntimeException("Slot end time must be after slot start time");
        }
        
        // Check no overlap for same doctor with new slot
        List<Appointment> overlappingDoctor = appointmentRepository.findOverlappingAppointmentsForDoctor(
            appointment.getDoctorId(),
            request.getNewSlotStart(),
            request.getNewSlotEnd()
        );
        // Exclude the current appointment from overlap check
        overlappingDoctor.removeIf(a -> a.getAppointmentId().equals(appointmentId));
        if (!overlappingDoctor.isEmpty()) {
            throw new RuntimeException("New slot overlaps with existing appointment for doctor");
        }
        
        // Check no overlap for same patient with new slot
        List<Appointment> overlappingPatient = appointmentRepository.findOverlappingAppointmentsForPatient(
            appointment.getPatientId(),
            request.getNewSlotStart(),
            request.getNewSlotEnd()
        );
        // Exclude the current appointment from overlap check
        overlappingPatient.removeIf(a -> a.getAppointmentId().equals(appointmentId));
        if (!overlappingPatient.isEmpty()) {
            throw new RuntimeException("Patient already has an appointment in this time slot");
        }
        
        // Update appointment
        appointment.setSlotStart(request.getNewSlotStart());
        appointment.setSlotEnd(request.getNewSlotEnd());
        appointment.setRescheduleCount(appointment.getRescheduleCount() + 1);
        appointment = appointmentRepository.save(appointment);
        
        log.info("Appointment rescheduled - ID: {}", appointmentId);
        
        // Record metrics
        appointmentsRescheduledCounter.increment();
        
        // Send notification
        sendNotification(appointment, "RESCHEDULED", correlationId);
        
        return toDTO(appointment);
    }
    
    @Transactional
    public AppointmentDTO cancelAppointment(Long appointmentId, String correlationId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Appointment not found"));
        
        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment = appointmentRepository.save(appointment);
        
        log.info("Appointment cancelled - ID: {}", appointmentId);
        
        // Record metrics
        appointmentsCancelledCounter.increment();
        
        // Notify billing service
        notifyBillingService(appointment, "CANCELLED", correlationId);
        
        // Send notification
        sendNotification(appointment, "CANCELLED", correlationId);
        
        return toDTO(appointment);
    }
    
    @Transactional
    public AppointmentDTO markNoShow(Long appointmentId, String correlationId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Appointment not found"));
        
        appointment.setStatus(AppointmentStatus.NO_SHOW);
        appointment = appointmentRepository.save(appointment);
        
        log.info("Appointment marked as NO_SHOW - ID: {}", appointmentId);
        
        // Notify billing service
        notifyBillingService(appointment, "NO_SHOW", correlationId);
        
        // Send notification
        sendNotification(appointment, "NO_SHOW", correlationId);
        
        return toDTO(appointment);
    }
    
    @Transactional
    public AppointmentDTO completeAppointment(Long appointmentId, String correlationId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Appointment not found"));
        
        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointment = appointmentRepository.save(appointment);
        
        log.info("Appointment completed - ID: {}", appointmentId);
        
        // Notify billing service to create bill
        notifyBillingService(appointment, "COMPLETED", correlationId);
        
        // Send notification
        sendNotification(appointment, "COMPLETED", correlationId);
        
        return toDTO(appointment);
    }
    
    public Page<AppointmentDTO> listAppointments(Long patientId, Long doctorId, String status, 
                                                   int page, int limit, String correlationId) {
        Pageable pageable = PageRequest.of(page - 1, limit);
        Page<Appointment> appointmentPage;
        
        // Convert status string to enum
        AppointmentStatus statusEnum = null;
        if (status != null && !status.isEmpty()) {
            try {
                statusEnum = AppointmentStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Invalid status, will be ignored
            }
        }
        
        // Use repository query with filters
        appointmentPage = appointmentRepository.findByFilters(patientId, doctorId, statusEnum, pageable);
        
        return appointmentPage.map(this::toDTO);
    }
    
    public AppointmentDTO getAppointment(Long appointmentId, String correlationId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Appointment not found"));
        return toDTO(appointment);
    }
    
    public Long countAppointmentsByDoctorIdAndDate(Long doctorId, LocalDateTime date, String correlationId) {
        // Calculate start and end of the day for the given date
        LocalDateTime dateStart = date.toLocalDate().atStartOfDay();
        LocalDateTime dateEnd = dateStart.plusDays(1);
        return appointmentRepository.countAppointmentsByDoctorIdAndDate(doctorId, dateStart, dateEnd);
    }
    
    private void sendNotification(Appointment appointment, String eventType, String correlationId) {
        try {
            Map<String, Object> notification = Map.of(
                "appointmentId", appointment.getAppointmentId(),
                "patientId", appointment.getPatientId(),
                "doctorId", appointment.getDoctorId(),
                "eventType", eventType,
                "slotStart", appointment.getSlotStart().toString(),
                "slotEnd", appointment.getSlotEnd().toString(),
                "correlationId", correlationId
            );
            
            webClientBuilder.build()
                .post()
                .uri("http://notification-service:8007/v1/notifications")
                .bodyValue(notification)
                .retrieve()
                .bodyToMono(Void.class)
                .subscribe();
        } catch (Exception e) {
            log.error("Failed to send notification", e);
        }
    }
    
    private void notifyBillingService(Appointment appointment, String eventType, String correlationId) {
        try {
            Map<String, Object> billingEvent = Map.of(
                "appointmentId", appointment.getAppointmentId(),
                "patientId", appointment.getPatientId(),
                "eventType", eventType,
                "correlationId", correlationId
            );
            
            webClientBuilder.build()
                .post()
                .uri("http://billing-service:8004/v1/billing-events")
                .bodyValue(billingEvent)
                .retrieve()
                .bodyToMono(Void.class)
                .subscribe();
        } catch (Exception e) {
            log.error("Failed to notify billing service", e);
        }
    }
    
    private AppointmentDTO toDTO(Appointment appointment) {
        AppointmentDTO dto = new AppointmentDTO();
        dto.setAppointmentId(appointment.getAppointmentId());
        dto.setPatientId(appointment.getPatientId());
        dto.setDoctorId(appointment.getDoctorId());
        dto.setDepartment(appointment.getDepartment());
        dto.setSlotStart(appointment.getSlotStart());
        dto.setSlotEnd(appointment.getSlotEnd());
        dto.setStatus(appointment.getStatus());
        dto.setCreatedAt(appointment.getCreatedAt());
        dto.setRescheduleCount(appointment.getRescheduleCount());
        dto.setVersion(appointment.getVersion());
        return dto;
    }
}


