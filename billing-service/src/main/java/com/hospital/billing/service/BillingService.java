package com.hospital.billing.service;

import com.hospital.billing.dto.BillDTO;
import com.hospital.billing.dto.BillingEventDTO;
import com.hospital.billing.model.Bill;
import com.hospital.billing.model.Bill.BillStatus;
import com.hospital.billing.repository.BillRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BillingService {
    private final BillRepository billRepository;
    private final WebClient.Builder webClientBuilder;
    private final Counter billsCreatedCounter;
    private final Timer billCreationLatency;
    private final Counter cancellationFeesChargedCounter;
    private final Counter noShowFeesChargedCounter;
    
    private static final BigDecimal TAX_RATE = new BigDecimal("0.05"); // 5% tax
    private static final BigDecimal CONSULTATION_FEE = new BigDecimal("500.00");
    private static final BigDecimal CANCELLATION_FEE_RATE = new BigDecimal("0.50"); // 50% if cancelled within 2h
    private static final BigDecimal NO_SHOW_FEE_RATE = new BigDecimal("1.00"); // 100% consultation fee
    
    @Transactional
    public BillDTO createBillForCompletedAppointment(Long appointmentId, Long patientId, String correlationId) {
        log.info("Creating bill for completed appointment - ID: {}", appointmentId);
        
        return billCreationLatency.record(() -> {
            return doCreateBill(appointmentId, patientId, correlationId);
        });
    }
    
    @Transactional
    private BillDTO doCreateBill(Long appointmentId, Long patientId, String correlationId) {
        // Check if bill already exists
        billRepository.findByAppointmentId(appointmentId)
            .ifPresent(bill -> {
                throw new RuntimeException("Bill already exists for this appointment");
            });
        
        // Get prescription medications (would call prescription service)
        BigDecimal medicationFee = getMedicationFee(appointmentId);
        
        // Calculate totals
        BigDecimal consultationFee = CONSULTATION_FEE;
        BigDecimal subtotal = consultationFee.add(medicationFee);
        BigDecimal taxAmount = subtotal.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = subtotal.add(taxAmount);
        
        Bill bill = new Bill();
        bill.setPatientId(patientId);
        bill.setAppointmentId(appointmentId);
        bill.setConsultationFee(consultationFee);
        bill.setMedicationFee(medicationFee);
        bill.setTaxAmount(taxAmount);
        bill.setTotalAmount(totalAmount);
        bill.setStatus(BillStatus.OPEN);
        
        bill = billRepository.save(bill);
        log.info("Bill created - ID: {}, Total: {}", bill.getBillId(), bill.getTotalAmount());
        
        // Record metrics
        billsCreatedCounter.increment();
        
        return toDTO(bill);
    }
    
    @Transactional
    public BillDTO handleCancellation(Long appointmentId, Long patientId, LocalDateTime slotStart, String correlationId) {
        log.info("Handling cancellation for appointment - ID: {}, Patient: {}", appointmentId, patientId);
        
        // Calculate hours until appointment
        LocalDateTime now = LocalDateTime.now();
        long hoursUntilStart = java.time.Duration.between(now, slotStart).toHours();
        
        // Find existing bill for this appointment
        Bill existingBill = billRepository.findByAppointmentId(appointmentId).orElse(null);
        
        if (hoursUntilStart > 2) {
            // Cancel > 2h before start → full refund/void
            if (existingBill != null) {
                if (existingBill.getStatus() == BillStatus.OPEN) {
                    // Void the bill
                    existingBill.setStatus(BillStatus.VOID);
                    billRepository.save(existingBill);
                    log.info("Bill voided due to cancellation > 2h before start - Bill ID: {}", existingBill.getBillId());
                    return toDTO(existingBill);
                } else if (existingBill.getStatus() == BillStatus.PAID) {
                    // Process full refund
                    return processRefund(existingBill.getBillId(), existingBill.getTotalAmount(), 
                        "Cancellation > 2h before appointment start", correlationId);
                }
            }
            // No bill exists, nothing to do
            return null;
        } else {
            // Cancel ≤ 2h → 50% cancellation fee
            BigDecimal cancellationFee = CONSULTATION_FEE.multiply(CANCELLATION_FEE_RATE);
            
            Bill bill;
            if (existingBill != null && existingBill.getStatus() == BillStatus.OPEN) {
                // Update existing bill with cancellation fee
                bill = existingBill;
                bill.setConsultationFee(cancellationFee);
                bill.setMedicationFee(BigDecimal.ZERO);
                bill.setTaxAmount(BigDecimal.ZERO);
                bill.setTotalAmount(cancellationFee);
            } else if (existingBill != null && existingBill.getStatus() == BillStatus.PAID) {
                // Bill already paid, create adjustment or process partial refund
                // For simplicity, we'll process a partial refund
                BigDecimal refundAmount = existingBill.getTotalAmount().subtract(cancellationFee);
                if (refundAmount.compareTo(BigDecimal.ZERO) > 0) {
                    return processRefund(existingBill.getBillId(), refundAmount, 
                        "Cancellation ≤ 2h before start - 50% fee applied", correlationId);
                }
                // If cancellation fee >= paid amount, create new bill for the fee
                bill = new Bill();
                bill.setPatientId(patientId);
                bill.setAppointmentId(appointmentId);
                bill.setConsultationFee(cancellationFee);
                bill.setMedicationFee(BigDecimal.ZERO);
                bill.setTaxAmount(BigDecimal.ZERO);
                bill.setTotalAmount(cancellationFee);
                bill.setStatus(BillStatus.OPEN);
            } else {
                // Create new cancellation fee bill
                bill = new Bill();
                bill.setPatientId(patientId);
                bill.setAppointmentId(appointmentId);
                bill.setConsultationFee(cancellationFee);
                bill.setMedicationFee(BigDecimal.ZERO);
                bill.setTaxAmount(BigDecimal.ZERO);
                bill.setTotalAmount(cancellationFee);
                bill.setStatus(BillStatus.OPEN);
            }
            
            bill = billRepository.save(bill);
            log.info("Cancellation bill created/updated - ID: {}, Fee: {}", bill.getBillId(), cancellationFee);
            
            // Record metrics
            cancellationFeesChargedCounter.increment();
            
            return toDTO(bill);
        }
    }
    
    @Transactional
    public BillDTO handleNoShow(Long appointmentId, Long patientId, String correlationId) {
        log.info("Handling no-show for appointment - ID: {}", appointmentId);
        
        BigDecimal noShowFee = CONSULTATION_FEE.multiply(NO_SHOW_FEE_RATE); // 100% consultation fee
        
        Bill bill = new Bill();
        bill.setPatientId(patientId);
        bill.setAppointmentId(appointmentId);
        bill.setConsultationFee(noShowFee);
        bill.setMedicationFee(BigDecimal.ZERO);
        bill.setTaxAmount(BigDecimal.ZERO);
        bill.setTotalAmount(noShowFee);
        bill.setStatus(BillStatus.OPEN);
        
        bill = billRepository.save(bill);
        log.info("No-show bill created - ID: {}, Fee: {}", bill.getBillId(), noShowFee);
        
        // Record metrics
        noShowFeesChargedCounter.increment();
        
        return toDTO(bill);
    }
    
    @Transactional
    public void processBillingEvent(BillingEventDTO event, String correlationId) {
        switch (event.getEventType()) {
            case "COMPLETED":
                createBillForCompletedAppointment(event.getAppointmentId(), event.getPatientId(), correlationId);
                break;
            case "CANCELLED":
                // Get slotStart from appointment service
                LocalDateTime slotStart = getAppointmentSlotStart(event.getAppointmentId());
                handleCancellation(event.getAppointmentId(), event.getPatientId(), slotStart, correlationId);
                break;
            case "NO_SHOW":
                handleNoShow(event.getAppointmentId(), event.getPatientId(), correlationId);
                break;
            default:
                log.warn("Unknown event type: {}", event.getEventType());
        }
    }
    
    public BillDTO getBill(Long billId, String correlationId) {
        Bill bill = billRepository.findById(billId)
            .orElseThrow(() -> new RuntimeException("Bill not found"));
        return toDTO(bill);
    }
    
    public List<BillDTO> getBillsByPatient(Long patientId, String correlationId) {
        List<Bill> bills = billRepository.findByPatientId(patientId);
        return bills.stream().map(this::toDTO).collect(Collectors.toList());
    }
    
    public List<BillDTO> getAllBills(String correlationId) {
        List<Bill> bills = billRepository.findAll();
        return bills.stream().map(this::toDTO).collect(Collectors.toList());
    }
    
    public Page<BillDTO> getAllBillsPaginated(int page, int limit, String correlationId) {
        Pageable pageable = PageRequest.of(page - 1, limit);
        Page<Bill> bills = billRepository.findAll(pageable);
        return bills.map(this::toDTO);
    }
    
    @Transactional
    public BillDTO voidBill(Long billId, String correlationId) {
        Bill bill = billRepository.findById(billId)
            .orElseThrow(() -> new RuntimeException("Bill not found"));
        
        // Can only void OPEN bills
        if (bill.getStatus() != BillStatus.OPEN) {
            throw new RuntimeException("Cannot void bill with status: " + bill.getStatus());
        }
        
        bill.setStatus(BillStatus.VOID);
        bill = billRepository.save(bill);
        log.info("Bill voided - ID: {}", billId);
        
        return toDTO(bill);
    }
    
    @Transactional
    public BillDTO markBillAsPaid(Long billId, String correlationId) {
        Bill bill = billRepository.findById(billId)
            .orElseThrow(() -> new RuntimeException("Bill not found"));
        
        // Can only mark OPEN bills as PAID
        if (bill.getStatus() != BillStatus.OPEN) {
            throw new RuntimeException("Cannot mark bill as PAID. Current status: " + bill.getStatus());
        }
        
        bill.setStatus(BillStatus.PAID);
        bill = billRepository.save(bill);
        log.info("Bill marked as PAID - ID: {}", billId);
        
        return toDTO(bill);
    }
    
    @Transactional
    public BillDTO processRefund(Long billId, BigDecimal refundAmount, String reason, String correlationId) {
        Bill bill = billRepository.findById(billId)
            .orElseThrow(() -> new RuntimeException("Bill not found"));
        
        // Can only refund PAID bills
        if (bill.getStatus() != BillStatus.PAID) {
            throw new RuntimeException("Cannot refund bill with status: " + bill.getStatus());
        }
        
        // Validate refund amount
        if (refundAmount == null || refundAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("Refund amount must be greater than zero");
        }
        
        if (refundAmount.compareTo(bill.getTotalAmount()) > 0) {
            throw new RuntimeException("Refund amount cannot exceed bill total amount");
        }
        
        bill.setRefundAmount(refundAmount);
        bill.setRefundReason(reason);
        
        // If full refund, mark as REFUNDED; otherwise keep as PAID (partial refund)
        if (refundAmount.compareTo(bill.getTotalAmount()) == 0) {
            bill.setStatus(BillStatus.REFUNDED);
            log.info("Full refund processed - Bill ID: {}, Amount: {}", billId, refundAmount);
        } else {
            log.info("Partial refund processed - Bill ID: {}, Amount: {}", billId, refundAmount);
        }
        
        bill = billRepository.save(bill);
        return toDTO(bill);
    }
    
    /**
     * Validates that bill can be edited (only OPEN bills can be edited)
     * This method is available for future use when implementing bill item editing
     */
    @SuppressWarnings("unused")
    private void validateBillEditable(Bill bill) {
        if (bill.getStatus() == BillStatus.PAID || bill.getStatus() == BillStatus.REFUNDED) {
            throw new RuntimeException("Cannot edit bill items after payment. Use adjustments/credit notes instead.");
        }
    }
    
    private BigDecimal getMedicationFee(Long appointmentId) {
        // Would call prescription service to get total medication cost
        // For now, return a default value
        try {
            // This would be an actual call to prescription service
            return new BigDecimal("200.00");
        } catch (Exception e) {
            log.warn("Could not fetch medication fee, using default", e);
            return BigDecimal.ZERO;
        }
    }
    
    private LocalDateTime getAppointmentSlotStart(Long appointmentId) {
        // Call appointment service to get slot start time
        try {
            String appointmentServiceUrl = System.getenv("APPOINTMENT_SERVICE_URL");
            if (appointmentServiceUrl == null) {
                appointmentServiceUrl = "http://appointment-service:8003";
            }
            
            @SuppressWarnings("unchecked")
            Map<String, Object> appointment = webClientBuilder.build()
                .get()
                .uri(appointmentServiceUrl + "/v1/appointments/{id}", appointmentId)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
            
            if (appointment != null && appointment.containsKey("slotStart")) {
                String slotStartStr = appointment.get("slotStart").toString();
                return LocalDateTime.parse(slotStartStr.replace("Z", "").replace("+00:00", ""));
            }
        } catch (Exception e) {
            log.warn("Could not fetch appointment slot start, using current time", e);
        }
        // Fallback to current time if unable to fetch
        return LocalDateTime.now().plusHours(1);
    }
    
    private BillDTO toDTO(Bill bill) {
        BillDTO dto = new BillDTO();
        dto.setBillId(bill.getBillId());
        dto.setPatientId(bill.getPatientId());
        dto.setAppointmentId(bill.getAppointmentId());
        dto.setConsultationFee(bill.getConsultationFee());
        dto.setMedicationFee(bill.getMedicationFee());
        dto.setTaxAmount(bill.getTaxAmount());
        dto.setTotalAmount(bill.getTotalAmount());
        dto.setStatus(bill.getStatus());
        dto.setRefundAmount(bill.getRefundAmount());
        dto.setRefundReason(bill.getRefundReason());
        dto.setCreatedAt(bill.getCreatedAt());
        return dto;
    }
}


