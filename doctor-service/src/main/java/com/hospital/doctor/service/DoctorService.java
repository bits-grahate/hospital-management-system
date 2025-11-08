package com.hospital.doctor.service;

import com.hospital.doctor.dto.DoctorDTO;
import com.hospital.doctor.dto.SlotCheckRequest;
import com.hospital.doctor.dto.SlotCheckResponse;
import com.hospital.doctor.model.Doctor;
import com.hospital.doctor.repository.DoctorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import org.springframework.beans.factory.annotation.Value;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class DoctorService {
    private final DoctorRepository doctorRepository;
    private final WebClient.Builder webClientBuilder;
    
    @Value("${doctor.scheduling.daily-cap:20}")
    private Integer dailyCap;
    
    @Transactional
    public DoctorDTO createDoctor(DoctorDTO doctorDTO, String correlationId) {
        log.info("Creating doctor - {}", doctorDTO.getEmail());
        Doctor doctor = new Doctor();
        doctor.setName(doctorDTO.getName());
        doctor.setEmail(doctorDTO.getEmail());
        doctor.setPhone(doctorDTO.getPhone());
        doctor.setDepartment(doctorDTO.getDepartment());
        doctor.setSpecialization(doctorDTO.getSpecialization());
        doctor.setActive(true);
        
        doctor = doctorRepository.save(doctor);
        log.info("Doctor created - ID: {}", doctor.getDoctorId());
        return toDTO(doctor);
    }
    
    public DoctorDTO getDoctor(Long doctorId, String correlationId) {
        Doctor doctor = doctorRepository.findById(doctorId)
            .orElseThrow(() -> new RuntimeException("Doctor not found"));
        return toDTO(doctor);
    }
    
    public Page<DoctorDTO> listDoctors(String department, String specialization, int page, int limit, String correlationId) {
        Pageable pageable = PageRequest.of(page - 1, limit);
        Page<Doctor> doctors;
        
        if (department != null && specialization != null) {
            List<Doctor> doctorList = doctorRepository.findByDepartmentAndSpecializationAndActiveTrue(department, specialization);
            // Create paginated result from filtered list
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), doctorList.size());
            List<Doctor> paginatedList = doctorList.subList(start, end);
            doctors = new org.springframework.data.domain.PageImpl<>(paginatedList, pageable, doctorList.size());
        } else if (department != null) {
            List<Doctor> doctorList = doctorRepository.findByDepartmentAndActiveTrue(department);
            // Create paginated result from filtered list
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), doctorList.size());
            List<Doctor> paginatedList = doctorList.subList(start, end);
            doctors = new org.springframework.data.domain.PageImpl<>(paginatedList, pageable, doctorList.size());
        } else if (specialization != null) {
            List<Doctor> doctorList = doctorRepository.findBySpecializationAndActiveTrue(specialization);
            // Create paginated result from filtered list
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), doctorList.size());
            List<Doctor> paginatedList = doctorList.subList(start, end);
            doctors = new org.springframework.data.domain.PageImpl<>(paginatedList, pageable, doctorList.size());
        } else {
            doctors = doctorRepository.findAll(pageable);
        }
        
        return doctors.map(this::toDTO);
    }
    
    public SlotCheckResponse checkAvailability(Long doctorId, SlotCheckRequest request, String correlationId) {
        Doctor doctor = doctorRepository.findById(doctorId)
            .orElseThrow(() -> new RuntimeException("Doctor not found"));
        
        // Check department match
        if (request.getDepartment() != null && !doctor.getDepartment().equals(request.getDepartment())) {
            return new SlotCheckResponse(false, 
                String.format("Doctor belongs to %s, not %s", doctor.getDepartment(), request.getDepartment()));
        }
        
        // Parse ISO 8601 timestamps
        LocalDateTime slotStart = LocalDateTime.parse(request.getSlotStart().replace("Z", ""));
        LocalDateTime slotEnd = LocalDateTime.parse(request.getSlotEnd().replace("Z", ""));
        
        // Check clinic hours (9 AM - 6 PM)
        LocalTime slotTime = slotStart.toLocalTime();
        if (slotTime.isBefore(LocalTime.of(9, 0)) || slotTime.isAfter(LocalTime.of(18, 0))) {
            return new SlotCheckResponse(false, "Outside clinic hours (9 AM - 6 PM)");
        }
        
        // Check lead time (≥ 2 hours from now)
        LocalDateTime now = LocalDateTime.now();
        if (slotStart.isBefore(now.plusHours(2))) {
            return new SlotCheckResponse(false, "Slot must be at least 2 hours from now");
        }
        
        // Check daily cap: max N appointments/day/doctor
        try {
            String dateStr = slotStart.toString();
            @SuppressWarnings("unchecked")
            Map<String, Object> countResponse = webClientBuilder.build()
                .get()
                .uri("http://appointment-service:8003/v1/appointments/doctor/{doctorId}/count?date={date}", 
                     doctorId, dateStr)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
            
            if (countResponse != null) {
                Long currentCount = ((Number) countResponse.get("count")).longValue();
                if (currentCount >= dailyCap) {
                    return new SlotCheckResponse(false, 
                        String.format("Doctor has reached daily appointment limit (%d appointments/day). Current count: %d", 
                                     dailyCap, currentCount));
                }
                log.info("Doctor {} has {} appointments on {}, daily cap: {}", 
                        doctorId, currentCount, slotStart.toLocalDate(), dailyCap);
            }
        } catch (Exception e) {
            log.warn("Failed to check daily cap for doctor {}: {}", doctorId, e.getMessage());
            // Continue with availability check if appointment service is unavailable
        }
        
        return new SlotCheckResponse(true, "Slot is available");
    }
    
    public List<String> listDepartments(String correlationId) {
        return doctorRepository.findAllDepartments();
    }
    
    public List<String> listSpecializations(String correlationId) {
        return doctorRepository.findAllSpecializations();
    }
    
    private DoctorDTO toDTO(Doctor doctor) {
        DoctorDTO dto = new DoctorDTO();
        dto.setDoctorId(doctor.getDoctorId());
        dto.setName(doctor.getName());
        dto.setEmail(doctor.getEmail());
        dto.setPhone(doctor.getPhone());
        dto.setDepartment(doctor.getDepartment());
        dto.setSpecialization(doctor.getSpecialization());
        dto.setCreatedAt(doctor.getCreatedAt());
        dto.setActive(doctor.getActive());
        return dto;
    }
}


