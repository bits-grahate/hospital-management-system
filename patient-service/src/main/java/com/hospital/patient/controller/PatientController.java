package com.hospital.patient.controller;

import com.hospital.patient.dto.ErrorResponse;
import com.hospital.patient.dto.PaginationResponse;
import com.hospital.patient.dto.PatientDTO;
import com.hospital.patient.service.PatientService;
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

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/v1")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Patient Service", description = "Patient Management API - CRUD operations, search by name/phone, PII masking in logs")
public class PatientController {
    private final PatientService patientService;
    
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        Map<String, Object> health = Map.of(
            "status", "healthy",
            "service", "patient-service",
            "port", 8001,
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
                "correlationId", "enabled",
                "piiMasking", "enabled"
            ),
            "availableEndpoints", Map.of(
                "GET", "/v1/patients, /v1/patients/{id}",
                "POST", "/v1/patients",
                "PUT", "/v1/patients/{id}",
                "DELETE", "/v1/patients/{id}"
            )
        );
        return ResponseEntity.ok(health);
    }
    
    @Operation(summary = "Create a new patient", description = "Creates a new patient record. Email must be unique.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Patient created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid input or duplicate email")
    })
    @PostMapping("/patients")
    public ResponseEntity<?> createPatient(@Valid @RequestBody PatientDTO patientDTO) {
        String correlationId = UUID.randomUUID().toString();
        try {
            org.slf4j.MDC.put("correlationId", correlationId);
            log.info("POST /v1/patients - Request received - Name: {}, Email: {}", 
                patientDTO.getName(), 
                patientDTO.getEmail() != null ? patientDTO.getEmail().substring(0, Math.min(3, patientDTO.getEmail().length())) + "***" : "null");
            PatientDTO created = patientService.createPatient(patientDTO, correlationId);
            log.info("POST /v1/patients - Success - Patient ID: {}, Correlation ID: {}", created.getPatientId(), correlationId);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            log.error("POST /v1/patients - Error: {} - Correlation ID: {}", e.getMessage(), correlationId);
            ErrorResponse error = new ErrorResponse("DUPLICATE_EMAIL", e.getMessage(), correlationId);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } finally {
            org.slf4j.MDC.remove("correlationId");
        }
    }
    
    @Operation(summary = "Get patient by ID", description = "Retrieves a patient by their unique ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Patient found"),
        @ApiResponse(responseCode = "404", description = "Patient not found")
    })
    @GetMapping("/patients/{patientId}")
    public ResponseEntity<?> getPatient(@PathVariable Long patientId) {
        String correlationId = UUID.randomUUID().toString();
        try {
            org.slf4j.MDC.put("correlationId", correlationId);
            log.info("GET /v1/patients/{} - Request received - Correlation ID: {}", patientId, correlationId);
            PatientDTO patient = patientService.getPatient(patientId, correlationId);
            log.info("GET /v1/patients/{} - Success - Patient found - Correlation ID: {}", patientId, correlationId);
            return ResponseEntity.ok(patient);
        } catch (RuntimeException e) {
            log.error("GET /v1/patients/{} - Error: {} - Correlation ID: {}", patientId, e.getMessage(), correlationId);
            ErrorResponse error = new ErrorResponse("NOT_FOUND", e.getMessage(), correlationId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } finally {
            org.slf4j.MDC.remove("correlationId");
        }
    }
    
    @Operation(summary = "Search patients", description = "Search patients by name and/or phone with pagination")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Search completed successfully")
    })
    @GetMapping("/patients")
    public ResponseEntity<?> searchPatients(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String phone,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {
        String correlationId = UUID.randomUUID().toString();
        try {
            org.slf4j.MDC.put("correlationId", correlationId);
            log.info("GET /v1/patients - Request received - Name: {}, Phone: {}, Page: {}, Limit: {}, Correlation ID: {}", 
                name != null ? name : "null", 
                phone != null ? phone.substring(0, Math.min(3, phone.length())) + "***" : "null", 
                page, limit, correlationId);
            PaginationResponse<PatientDTO> response = patientService.searchPatients(name, phone, page, limit, correlationId);
            log.info("GET /v1/patients - Success - Found {} patients (Total: {}, Page: {}) - Correlation ID: {}", 
                response.getData().size(), response.getPagination().getTotal(), page, correlationId);
            return ResponseEntity.ok(response);
        } finally {
            org.slf4j.MDC.remove("correlationId");
        }
    }
    
    @PutMapping("/patients/{patientId}")
    public ResponseEntity<?> updatePatient(@PathVariable Long patientId, 
                                          @Valid @RequestBody PatientDTO patientDTO) {
        String correlationId = UUID.randomUUID().toString();
        try {
            org.slf4j.MDC.put("correlationId", correlationId);
            log.info("PUT /v1/patients/{} - Request received - Correlation ID: {}", patientId, correlationId);
            PatientDTO updated = patientService.updatePatient(patientId, patientDTO, correlationId);
            log.info("PUT /v1/patients/{} - Success - Patient updated - Correlation ID: {}", patientId, correlationId);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("PUT /v1/patients/{} - Error: {} - Correlation ID: {}", patientId, e.getMessage(), correlationId);
            HttpStatus status = e.getMessage().contains("already exists") 
                ? HttpStatus.BAD_REQUEST 
                : HttpStatus.NOT_FOUND;
            ErrorResponse error = new ErrorResponse(
                e.getMessage().contains("already exists") ? "DUPLICATE_EMAIL" : "NOT_FOUND", 
                e.getMessage(), 
                correlationId
            );
            return ResponseEntity.status(status).body(error);
        } finally {
            org.slf4j.MDC.remove("correlationId");
        }
    }
    
    @DeleteMapping("/patients/{patientId}")
    public ResponseEntity<?> deletePatient(@PathVariable Long patientId) {
        String correlationId = UUID.randomUUID().toString();
        try {
            org.slf4j.MDC.put("correlationId", correlationId);
            log.info("DELETE /v1/patients/{} - Request received - Correlation ID: {}", patientId, correlationId);
            patientService.deletePatient(patientId, correlationId);
            log.info("DELETE /v1/patients/{} - Success - Patient deleted - Correlation ID: {}", patientId, correlationId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("DELETE /v1/patients/{} - Error: {} - Correlation ID: {}", patientId, e.getMessage(), correlationId);
            ErrorResponse error = new ErrorResponse("NOT_FOUND", e.getMessage(), correlationId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } finally {
            org.slf4j.MDC.remove("correlationId");
        }
    }
}


