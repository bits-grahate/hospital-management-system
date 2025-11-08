package com.hospital.billing.controller;

import com.hospital.billing.dto.BillDTO;
import com.hospital.billing.dto.BillingEventDTO;
import com.hospital.billing.dto.ErrorResponse;
import com.hospital.billing.service.BillingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Billing Service", description = "Billing Management API - Generate bills for completed appointments, compute taxes, handle cancellations")
public class BillingController {
    private final BillingService billingService;
    
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        Map<String, Object> health = Map.of(
            "status", "healthy",
            "service", "billing-service",
            "port", 8004,
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
                "bills_created_total", "Counter - Total bills created",
                "bill_creation_latency_ms", "Timer - Bill creation latency in milliseconds",
                "cancellation_fees_charged_total", "Counter - Total cancellation fees charged",
                "no_show_fees_charged_total", "Counter - Total no-show fees charged",
                "payments_failed_total", "Counter - Total failed payments"
            ),
            "logging", Map.of(
                "format", "JSON",
                "correlationId", "enabled"
            ),
            "availableEndpoints", Map.of(
                "GET", "/v1/bills, /v1/bills/{id}, /v1/bills/patient/{patientId}",
                "POST", "/v1/billing-events, /v1/bills/{id}/refund",
                "PUT", "/v1/bills/{id}/void, /v1/bills/{id}/paid"
            )
        );
        return ResponseEntity.ok(health);
    }
    
    @PostMapping("/billing-events")
    public ResponseEntity<?> processBillingEvent(@RequestBody BillingEventDTO event) {
        String correlationId = UUID.randomUUID().toString();
        try {
            org.slf4j.MDC.put("correlationId", correlationId);
            billingService.processBillingEvent(event, correlationId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            ErrorResponse error = new ErrorResponse("BILLING_ERROR", e.getMessage(), correlationId);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } finally {
            org.slf4j.MDC.remove("correlationId");
        }
    }
    
    @GetMapping("/bills/{billId}")
    public ResponseEntity<?> getBill(@PathVariable Long billId) {
        String correlationId = UUID.randomUUID().toString();
        try {
            org.slf4j.MDC.put("correlationId", correlationId);
            BillDTO bill = billingService.getBill(billId, correlationId);
            return ResponseEntity.ok(bill);
        } catch (RuntimeException e) {
            ErrorResponse error = new ErrorResponse("NOT_FOUND", e.getMessage(), correlationId);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } finally {
            org.slf4j.MDC.remove("correlationId");
        }
    }
    
    @Operation(summary = "Get all bills", description = "Retrieves all bills with pagination")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Bills retrieved successfully")
    })
    @GetMapping("/bills")
    public ResponseEntity<?> getAllBills(
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "20") int limit) {
        String correlationId = UUID.randomUUID().toString();
        try {
            org.slf4j.MDC.put("correlationId", correlationId);
            Page<BillDTO> bills = billingService.getAllBillsPaginated(page, limit, correlationId);
            return ResponseEntity.ok(bills);
        } finally {
            org.slf4j.MDC.remove("correlationId");
        }
    }
    
    @GetMapping("/bills/patient/{patientId}")
    public ResponseEntity<?> getBillsByPatient(@PathVariable Long patientId) {
        String correlationId = UUID.randomUUID().toString();
        try {
            org.slf4j.MDC.put("correlationId", correlationId);
            List<BillDTO> bills = billingService.getBillsByPatient(patientId, correlationId);
            return ResponseEntity.ok(bills);
        } finally {
            org.slf4j.MDC.remove("correlationId");
        }
    }
    
    @PutMapping("/bills/{billId}/void")
    public ResponseEntity<?> voidBill(@PathVariable Long billId) {
        String correlationId = UUID.randomUUID().toString();
        try {
            org.slf4j.MDC.put("correlationId", correlationId);
            BillDTO bill = billingService.voidBill(billId, correlationId);
            return ResponseEntity.ok(bill);
        } catch (RuntimeException e) {
            ErrorResponse error = new ErrorResponse("VOID_FAILED", e.getMessage(), correlationId);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } finally {
            org.slf4j.MDC.remove("correlationId");
        }
    }
    
    @PutMapping("/bills/{billId}/paid")
    public ResponseEntity<?> markBillAsPaid(@PathVariable Long billId) {
        String correlationId = UUID.randomUUID().toString();
        try {
            org.slf4j.MDC.put("correlationId", correlationId);
            BillDTO bill = billingService.markBillAsPaid(billId, correlationId);
            return ResponseEntity.ok(bill);
        } catch (RuntimeException e) {
            ErrorResponse error = new ErrorResponse("MARK_PAID_FAILED", e.getMessage(), correlationId);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } finally {
            org.slf4j.MDC.remove("correlationId");
        }
    }
    
    @PostMapping("/bills/{billId}/refund")
    public ResponseEntity<?> processRefund(
            @PathVariable Long billId,
            @RequestBody RefundRequest refundRequest) {
        String correlationId = UUID.randomUUID().toString();
        try {
            org.slf4j.MDC.put("correlationId", correlationId);
            BillDTO bill = billingService.processRefund(
                billId, 
                refundRequest.getRefundAmount(), 
                refundRequest.getReason(), 
                correlationId
            );
            return ResponseEntity.ok(bill);
        } catch (RuntimeException e) {
            ErrorResponse error = new ErrorResponse("REFUND_FAILED", e.getMessage(), correlationId);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } finally {
            org.slf4j.MDC.remove("correlationId");
        }
    }
    
    // Inner class for refund request
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class RefundRequest {
        private java.math.BigDecimal refundAmount;
        private String reason;
    }
}



