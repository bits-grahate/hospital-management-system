package com.hospital.doctor.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SlotCheckRequest {
    private String department;
    
    @NotBlank(message = "Slot start time is required")
    private String slotStart; // ISO 8601 format
    
    @NotBlank(message = "Slot end time is required")
    private String slotEnd; // ISO 8601 format
}



