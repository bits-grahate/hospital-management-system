package com.hospital.billing.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.hospital.billing.model.Bill.BillStatus;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class BillDTO {
    private Long billId;
    private Long patientId;
    private Long appointmentId;
    private BigDecimal consultationFee;
    private BigDecimal medicationFee;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private BillStatus status;
    private BigDecimal refundAmount;
    private String refundReason;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
}



