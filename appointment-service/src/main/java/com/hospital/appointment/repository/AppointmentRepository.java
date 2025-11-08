package com.hospital.appointment.repository;

import com.hospital.appointment.model.Appointment;
import com.hospital.appointment.model.Appointment.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByPatientIdAndStatus(Long patientId, AppointmentStatus status);
    
    Page<Appointment> findByPatientId(Long patientId, Pageable pageable);
    
    Page<Appointment> findByDoctorId(Long doctorId, Pageable pageable);
    
    Page<Appointment> findByStatus(AppointmentStatus status, Pageable pageable);
    
    Page<Appointment> findByPatientIdAndDoctorId(Long patientId, Long doctorId, Pageable pageable);
    
    Page<Appointment> findByPatientIdAndStatus(Long patientId, AppointmentStatus status, Pageable pageable);
    
    Page<Appointment> findByDoctorIdAndStatus(Long doctorId, AppointmentStatus status, Pageable pageable);
    
    @Query("SELECT a FROM Appointment a WHERE " +
           "(:patientId IS NULL OR a.patientId = :patientId) AND " +
           "(:doctorId IS NULL OR a.doctorId = :doctorId) AND " +
           "(:status IS NULL OR a.status = :status)")
    Page<Appointment> findByFilters(
        @Param("patientId") Long patientId,
        @Param("doctorId") Long doctorId,
        @Param("status") AppointmentStatus status,
        Pageable pageable
    );
    
    @Query("SELECT a FROM Appointment a WHERE a.doctorId = :doctorId " +
           "AND a.status != 'CANCELLED' " +
           "AND a.slotStart < :slotEnd " +
           "AND a.slotEnd > :slotStart")
    List<Appointment> findOverlappingAppointmentsForDoctor(
        @Param("doctorId") Long doctorId,
        @Param("slotStart") LocalDateTime slotStart,
        @Param("slotEnd") LocalDateTime slotEnd
    );
    
    @Query("SELECT a FROM Appointment a WHERE a.patientId = :patientId " +
           "AND a.status != 'CANCELLED' " +
           "AND a.slotStart < :slotEnd " +
           "AND a.slotEnd > :slotStart")
    List<Appointment> findOverlappingAppointmentsForPatient(
        @Param("patientId") Long patientId,
        @Param("slotStart") LocalDateTime slotStart,
        @Param("slotEnd") LocalDateTime slotEnd
    );
    
    List<Appointment> findByDoctorIdAndStatusNot(Long doctorId, AppointmentStatus status);
    
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.doctorId = :doctorId " +
           "AND a.slotStart >= :dateStart AND a.slotStart < :dateEnd " +
           "AND a.status IN ('SCHEDULED', 'COMPLETED')")
    Long countAppointmentsByDoctorIdAndDate(
        @Param("doctorId") Long doctorId,
        @Param("dateStart") LocalDateTime dateStart,
        @Param("dateEnd") LocalDateTime dateEnd
    );
}


