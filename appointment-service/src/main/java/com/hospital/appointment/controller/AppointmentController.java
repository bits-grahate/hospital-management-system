package com.hospital.appointment.controller;

import com.hospital.appointment.dto.AppointmentDTO;
import com.hospital.appointment.dto.ErrorResponse;
import com.hospital.appointment.dto.RescheduleRequest;
import com.hospital.appointment.service.AppointmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Appointment Service", description = "Appointment Management API - Book/reschedule/cancel appointments with constraints & slot collision checks")
public class AppointmentController {
    private final AppointmentService appointmentService;
    
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        Map<String, Object> health = Map.of(
            "status", "healthy",
            "service", "appointment-service",
            "port", 8003,
            "endpoints", Map.of(
                "api", "/v1",
                "swagger", "/swagger-ui.html",
                "swaggerAlt", "/swagger-ui/index.html",
                "apiDocs", "/v3/api-docs",
                "h2Console", "/h2-console"
            ),
            "monitoring", Map.of(
                "health", "/actuator/health",
                "metrics", "/actuator/metrics",
                "prometheus", "/actuator/prometheus",
                "info", "/actuator/info"
            ),
            "customMetrics", Map.of(
                "appointments_created_total", "Counter - Total appointments created",
                "appointments_cancelled_total", "Counter - Total appointments cancelled",
                "appointments_rescheduled_total", "Counter - Total appointments rescheduled",
                "appointment_booking_latency_ms", "Timer - Booking latency in milliseconds"
            ),
            "logging", Map.of(
                "format", "JSON",
                "correlationId", "enabled"
            ),
            "availableEndpoints", Map.of(
                "GET", "/v1/appointments, /v1/appointments/{id}, /v1/appointments/doctor/{doctorId}/count",
                "POST", "/v1/appointments",
                "PUT", "/v1/appointments/{id}/reschedule, /v1/appointments/{id}/cancel, /v1/appointments/{id}/complete, /v1/appointments/{id}/no-show"
            )
        );
        return ResponseEntity.ok(health);
    }
    
    @Operation(summary = "Book appointment", description = "Books a new appointment. Validates patient, doctor, slot availability, clinic hours, lead time, and daily cap.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Appointment booked successfully"),
        @ApiResponse(responseCode = "400", description = "Booking failed - validation error")
    })
    @PostMapping("/appointments")
    public ResponseEntity<?> bookAppointment(@Valid @RequestBody AppointmentDTO appointmentDTO) {
        String correlationId = UUID.randomUUID().toString();
        try {
            org.slf4j.MDC.put("correlationId", correlationId);
            AppointmentDTO created = appointmentService.bookAppointment(appointmentDTO, correlationId);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            ErrorResponse error = new ErrorResponse("BOOKING_FAILED", e.getMessage(), correlationId);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } finally {
            org.slf4j.MDC.remove("correlationId");
        }
    }
    
    @GetMapping("/appointments")
    public ResponseEntity<?> listAppointments(
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        String correlationId = UUID.randomUUID().toString();
        try {
            org.slf4j.MDC.put("correlationId", correlationId);
            Page<AppointmentDTO> appointments = appointmentService.listAppointments(patientId, doctorId, status, page, limit, correlationId);
            return ResponseEntity.ok(appointments);
        } catch (RuntimeException e) {
            ErrorResponse error = new ErrorResponse("LIST_FAILED", e.getMessage(), correlationId);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } finally {
            org.slf4j.MDC.remove("correlationId");
        }
    }
    
    @GetMapping("/appointments/{appointmentId}")
    public ResponseEntity<?> getAppointment(@PathVariable Long appointmentId) {
        String correlationId = UUID.randomUUID().toString();
        try {
            org.slf4j.MDC.put("correlationId", correlationId);
            AppointmentDTO appointment = appointmentService.getAppointment(appointmentId, correlationId);
            return ResponseEntity.ok(appointment);
        } catch (RuntimeException e) {
            ErrorResponse error = new ErrorResponse("NOT_FOUND", e.getMessage(), correlationId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } finally {
            org.slf4j.MDC.remove("correlationId");
        }
    }
    
    @PutMapping("/appointments/{appointmentId}/reschedule")
    public ResponseEntity<?> rescheduleAppointment(@PathVariable Long appointmentId,
                                                    @Valid @RequestBody RescheduleRequest request) {
        String correlationId = UUID.randomUUID().toString();
        try {
            org.slf4j.MDC.put("correlationId", correlationId);
            AppointmentDTO updated = appointmentService.rescheduleAppointment(appointmentId, request, correlationId);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            ErrorResponse error = new ErrorResponse("RESCHEDULE_FAILED", e.getMessage(), correlationId);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } finally {
            org.slf4j.MDC.remove("correlationId");
        }
    }
    
    @PutMapping("/appointments/{appointmentId}/cancel")
    public ResponseEntity<?> cancelAppointment(@PathVariable Long appointmentId) {
        String correlationId = UUID.randomUUID().toString();
        try {
            org.slf4j.MDC.put("correlationId", correlationId);
            AppointmentDTO cancelled = appointmentService.cancelAppointment(appointmentId, correlationId);
            return ResponseEntity.ok(cancelled);
        } catch (RuntimeException e) {
            ErrorResponse error = new ErrorResponse("CANCEL_FAILED", e.getMessage(), correlationId);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } finally {
            org.slf4j.MDC.remove("correlationId");
        }
    }
    
    @PutMapping("/appointments/{appointmentId}/complete")
    public ResponseEntity<?> completeAppointment(@PathVariable Long appointmentId) {
        String correlationId = UUID.randomUUID().toString();
        try {
            org.slf4j.MDC.put("correlationId", correlationId);
            AppointmentDTO completed = appointmentService.completeAppointment(appointmentId, correlationId);
            return ResponseEntity.ok(completed);
        } catch (RuntimeException e) {
            ErrorResponse error = new ErrorResponse("COMPLETE_FAILED", e.getMessage(), correlationId);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } finally {
            org.slf4j.MDC.remove("correlationId");
        }
    }
    
    @PutMapping("/appointments/{appointmentId}/no-show")
    public ResponseEntity<?> markNoShow(@PathVariable Long appointmentId) {
        String correlationId = UUID.randomUUID().toString();
        try {
            org.slf4j.MDC.put("correlationId", correlationId);
            AppointmentDTO noShow = appointmentService.markNoShow(appointmentId, correlationId);
            return ResponseEntity.ok(noShow);
        } catch (RuntimeException e) {
            ErrorResponse error = new ErrorResponse("NO_SHOW_FAILED", e.getMessage(), correlationId);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } finally {
            org.slf4j.MDC.remove("correlationId");
        }
    }
    
    @GetMapping("/appointments/doctor/{doctorId}/count")
    public ResponseEntity<?> countAppointmentsByDoctorAndDate(
            @PathVariable Long doctorId,
            @RequestParam String date) {
        String correlationId = UUID.randomUUID().toString();
        try {
            org.slf4j.MDC.put("correlationId", correlationId);
            LocalDateTime dateTime = LocalDateTime.parse(date.replace("Z", ""));
            Long count = appointmentService.countAppointmentsByDoctorIdAndDate(doctorId, dateTime, correlationId);
            return ResponseEntity.ok(Map.of("doctorId", doctorId, "date", date, "count", count));
        } catch (Exception e) {
            ErrorResponse error = new ErrorResponse("COUNT_FAILED", e.getMessage(), correlationId);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } finally {
            org.slf4j.MDC.remove("correlationId");
        }
    }
}


