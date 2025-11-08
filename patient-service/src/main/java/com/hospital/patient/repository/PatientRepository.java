package com.hospital.patient.repository;

import com.hospital.patient.model.Patient;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByEmail(String email);
    
    @Query("SELECT p FROM Patient p WHERE " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%')) OR :name IS NULL)")
    Page<Patient> findByNameContainingIgnoreCase(@Param("name") String name, Pageable pageable);
    
    @Query("SELECT p FROM Patient p WHERE " +
           "(p.phone LIKE CONCAT('%', :phone, '%') OR :phone IS NULL)")
    Page<Patient> findByPhoneContaining(@Param("phone") String phone, Pageable pageable);
    
    @Query("SELECT p FROM Patient p WHERE " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%')) OR :name IS NULL) AND " +
           "(p.phone LIKE CONCAT('%', :phone, '%') OR :phone IS NULL)")
    Page<Patient> searchPatients(@Param("name") String name, @Param("phone") String phone, Pageable pageable);
}


