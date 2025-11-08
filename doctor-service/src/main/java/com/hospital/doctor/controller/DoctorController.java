package com.hospital.doctor.controller;

import com.hospital.doctor.dto.DoctorDTO;
import com.hospital.doctor.dto.ErrorResponse;
import com.hospital.doctor.dto.SlotCheckRequest;
import com.hospital.doctor.dto.SlotCheckResponse;
import com.hospital.doctor.service.DoctorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Doctor & Scheduling Service", description = "Doctor & Scheduling Management API - Doctors listing, department filter, slot availability checks")
public class DoctorController {
    private final DoctorService doctorService;
    
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        Map<String, Object> health = Map.of(
            "status", "healthy",
            "service", "doctor-service",
            "port", 8002,
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
                "info", "/actuator/info"
            ),
            "logging", Map.of(
                "format", "JSON",
                "correlationId", "enabled"
            ),
            "availableEndpoints", Map.of(
                "GET", "/v1/doctors, /v1/doctors/{id}, /v1/departments, /v1/specializations",
                "POST", "/v1/doctors, /v1/doctors/{id}/check-availability"
            )
        );
        return ResponseEntity.ok(health);
    }
    
    @PostMapping("/doctors")
    public ResponseEntity<?> createDoctor(@Valid @RequestBody DoctorDTO doctorDTO) {
        String correlationId = UUID.randomUUID().toString();
        try {
            org.slf4j.MDC.put("correlationId", correlationId);
            DoctorDTO created = doctorService.createDoctor(doctorDTO, correlationId);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            ErrorResponse error = new ErrorResponse("ERROR", e.getMessage(), correlationId);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } finally {
            org.slf4j.MDC.remove("correlationId");
        }
    }
    
    @GetMapping("/doctors/{doctorId}")
    public ResponseEntity<?> getDoctor(@PathVariable Long doctorId) {
        String correlationId = UUID.randomUUID().toString();
        try {
            org.slf4j.MDC.put("correlationId", correlationId);
            DoctorDTO doctor = doctorService.getDoctor(doctorId, correlationId);
            return ResponseEntity.ok(doctor);
        } catch (RuntimeException e) {
            ErrorResponse error = new ErrorResponse("NOT_FOUND", e.getMessage(), correlationId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } finally {
            org.slf4j.MDC.remove("correlationId");
        }
    }
    
    @GetMapping("/doctors")
    public ResponseEntity<?> listDoctors(
            @RequestParam(required = false) String department,
            @RequestParam(required = false) String specialization,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) Integer limit) {
        String correlationId = UUID.randomUUID().toString();
        try {
            org.slf4j.MDC.put("correlationId", correlationId);
            // Handle pagination: accept both 'size' and 'limit', convert page 0 to 1
            int pageNumber = (page == null || page == 0) ? 1 : page;
            int pageSize = (limit != null) ? limit : ((size != null) ? size : 20);
            Page<DoctorDTO> doctors = doctorService.listDoctors(department, specialization, pageNumber, pageSize, correlationId);
            return ResponseEntity.ok(doctors);
        } finally {
            org.slf4j.MDC.remove("correlationId");
        }
    }
    
    @Operation(summary = "Check doctor slot availability", description = "Checks if a doctor is available for a given time slot. Validates clinic hours, lead time, and daily cap.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Availability check completed"),
        @ApiResponse(responseCode = "404", description = "Doctor not found")
    })
    @PostMapping("/doctors/{doctorId}/check-availability")
    public ResponseEntity<?> checkAvailability(@PathVariable Long doctorId, 
                                               @Valid @RequestBody SlotCheckRequest request) {
        String correlationId = UUID.randomUUID().toString();
        try {
            org.slf4j.MDC.put("correlationId", correlationId);
            SlotCheckResponse response = doctorService.checkAvailability(doctorId, request, correlationId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            ErrorResponse error = new ErrorResponse("NOT_FOUND", e.getMessage(), correlationId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } finally {
            org.slf4j.MDC.remove("correlationId");
        }
    }
    
    @GetMapping("/departments")
    public ResponseEntity<?> listDepartments() {
        String correlationId = UUID.randomUUID().toString();
        try {
            org.slf4j.MDC.put("correlationId", correlationId);
            List<String> departments = doctorService.listDepartments(correlationId);
            return ResponseEntity.ok(departments);
        } finally {
            org.slf4j.MDC.remove("correlationId");
        }
    }
    
    @GetMapping("/specializations")
    public ResponseEntity<?> listSpecializations() {
        String correlationId = UUID.randomUUID().toString();
        try {
            org.slf4j.MDC.put("correlationId", correlationId);
            List<String> specializations = doctorService.listSpecializations(correlationId);
            return ResponseEntity.ok(specializations);
        } finally {
            org.slf4j.MDC.remove("correlationId");
        }
    }
}


