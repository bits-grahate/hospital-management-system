package com.hospital.appointment.dto;

import com.hospital.appointment.model.Appointment.AppointmentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AppointmentDTO {
    private Long appointmentId;
    
    @NotNull(message = "Patient ID is required")
    private Long patientId;
    
    @NotNull(message = "Doctor ID is required")
    private Long doctorId;
    
    @NotNull(message = "Department is required")
    private String department;
    
    @NotNull(message = "Slot start time is required")
    private LocalDateTime slotStart;
    
    @NotNull(message = "Slot end time is required")
    private LocalDateTime slotEnd;
    
    private AppointmentStatus status;
    private LocalDateTime createdAt;
    private Integer rescheduleCount;
    private Long version;
}



