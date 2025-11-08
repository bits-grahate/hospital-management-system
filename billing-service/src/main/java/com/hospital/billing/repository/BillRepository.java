package com.hospital.billing.repository;

import com.hospital.billing.model.Bill;
import com.hospital.billing.model.Bill.BillStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BillRepository extends JpaRepository<Bill, Long> {
    List<Bill> findByPatientId(Long patientId);
    
    Optional<Bill> findByAppointmentId(Long appointmentId);
    
    List<Bill> findByStatus(BillStatus status);
}



