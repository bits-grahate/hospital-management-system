package com.hospital.billing.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bills")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Bill {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long billId;
    
    @Column(nullable = false)
    private Long patientId;
    
    @Column(nullable = false)
    private Long appointmentId;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal consultationFee;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal medicationFee;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal taxAmount; // 5% tax
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BillStatus status = BillStatus.OPEN;
    
    @Column(precision = 10, scale = 2)
    private BigDecimal refundAmount; // For partial refunds
    
    @Column
    private String refundReason; // Reason for refund
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = BillStatus.OPEN;
        }
    }
    
    public enum BillStatus {
        OPEN,      // Bill created, awaiting payment
        PAID,      // Payment received
        VOID,      // Bill cancelled/voided before payment
        REFUNDED   // Full or partial refund issued
    }
}



