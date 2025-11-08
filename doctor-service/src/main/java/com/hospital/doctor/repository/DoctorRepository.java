package com.hospital.doctor.repository;

import com.hospital.doctor.model.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    Optional<Doctor> findByEmail(String email);
    
    List<Doctor> findByDepartmentAndActiveTrue(String department);
    
    List<Doctor> findBySpecializationAndActiveTrue(String specialization);
    
    List<Doctor> findByDepartmentAndSpecializationAndActiveTrue(String department, String specialization);
    
    @Query("SELECT DISTINCT d.department FROM Doctor d WHERE d.active = true")
    List<String> findAllDepartments();
    
    @Query("SELECT DISTINCT d.specialization FROM Doctor d WHERE d.active = true")
    List<String> findAllSpecializations();
}


