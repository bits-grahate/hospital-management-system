package com.hospital.billing.dto;

import lombok.Data;

@Data
public class BillingEventDTO {
    private Long appointmentId;
    private Long patientId;
    private String eventType; // COMPLETED, CANCELLED, NO_SHOW
    private String correlationId;
}



