package com.hospital.appointment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class RescheduleRequest {
    @NotNull(message = "New slot start time is required")
    private LocalDateTime newSlotStart;
    
    @NotNull(message = "New slot end time is required")
    private LocalDateTime newSlotEnd;
}



