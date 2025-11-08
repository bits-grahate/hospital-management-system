package com.hospital.patient.service;

import com.hospital.patient.dto.PatientDTO;
import com.hospital.patient.dto.PaginationResponse;
import com.hospital.patient.model.Patient;
import com.hospital.patient.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PatientService {
    private final PatientRepository patientRepository;
    
    public String maskPII(String value) {
        if (value == null || value.isEmpty()) {
            return value;
        }
        if (value.contains("@")) { // Email
            String[] parts = value.split("@");
            if (parts[0].length() > 2) {
                return parts[0].substring(0, 2) + "***@" + parts[1];
            }
            return "***@" + parts[1];
        } else if (value.length() > 4) { // Phone
            return value.substring(0, 2) + "***" + value.substring(value.length() - 2);
        }
        return "***";
    }
    
    @Transactional
    public PatientDTO createPatient(PatientDTO patientDTO, String correlationId) {
        log.info("Creating patient - {}", maskPII(patientDTO.getEmail()), 
                 org.slf4j.MDC.get("correlationId"));
        
        if (patientRepository.findByEmail(patientDTO.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }
        
        Patient patient = new Patient();
        patient.setName(patientDTO.getName());
        patient.setEmail(patientDTO.getEmail());
        patient.setPhone(patientDTO.getPhone());
        patient.setDob(patientDTO.getDob());
        patient.setActive(true);
        
        patient = patientRepository.save(patient);
        log.info("Patient created - ID: {}", patient.getPatientId());
        return toDTO(patient);
    }
    
    public PatientDTO getPatient(Long patientId, String correlationId) {
        log.debug("Fetching patient by ID: {}", patientId);
        Patient patient = patientRepository.findById(patientId)
            .orElseThrow(() -> {
                log.warn("Patient not found - ID: {}", patientId);
                return new RuntimeException("Patient not found");
            });
        log.debug("Patient found - ID: {}, Name: {}", patient.getPatientId(), patient.getName());
        return toDTO(patient);
    }
    
    public PaginationResponse<PatientDTO> searchPatients(String name, String phone, 
                                                         int page, int limit, 
                                                         String correlationId) {
        log.debug("Searching patients - Name: {}, Phone: {}, Page: {}, Limit: {}", name, phone, page, limit);
        Pageable pageable = PageRequest.of(page - 1, limit);
        
        List<Patient> patients;
        long total;
        
        if (name != null && phone != null) {
            log.debug("Searching by both name and phone");
            Page<Patient> patientPage = patientRepository.searchPatients(name, phone, pageable);
            patients = patientPage.getContent();
            total = patientPage.getTotalElements();
        } else if (name != null) {
            log.debug("Searching by name only");
            Page<Patient> patientPage = patientRepository.findByNameContainingIgnoreCase(name, pageable);
            patients = patientPage.getContent();
            total = patientPage.getTotalElements();
        } else if (phone != null) {
            log.debug("Searching by phone only");
            Page<Patient> patientPage = patientRepository.findByPhoneContaining(phone, pageable);
            patients = patientPage.getContent();
            total = patientPage.getTotalElements();
        } else {
            log.debug("Fetching all patients with pagination");
            Page<Patient> patientPage = patientRepository.findAll(pageable);
            patients = patientPage.getContent();
            total = patientPage.getTotalElements();
        }
        
        log.debug("Search completed - Found {} patients, Total: {}", patients.size(), total);
        
        List<PatientDTO> patientDTOs = patients.stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
        
        PaginationResponse.PaginationInfo paginationInfo = 
            new PaginationResponse.PaginationInfo(page, limit, total, (int) Math.ceil((double) total / limit));
        
        return new PaginationResponse<>(patientDTOs, paginationInfo);
    }
    
    @Transactional
    public PatientDTO updatePatient(Long patientId, PatientDTO patientDTO, String correlationId) {
        Patient patient = patientRepository.findById(patientId)
            .orElseThrow(() -> new RuntimeException("Patient not found"));
        
        // Check for duplicate email if email is being updated
        if (patientDTO.getEmail() != null && !patientDTO.getEmail().equals(patient.getEmail())) {
            if (patientRepository.findByEmail(patientDTO.getEmail()).isPresent()) {
                throw new RuntimeException("Email already exists");
            }
        }
        
        if (patientDTO.getName() != null) patient.setName(patientDTO.getName());
        if (patientDTO.getEmail() != null) patient.setEmail(patientDTO.getEmail());
        if (patientDTO.getPhone() != null) patient.setPhone(patientDTO.getPhone());
        if (patientDTO.getDob() != null) patient.setDob(patientDTO.getDob());
        
        patient = patientRepository.save(patient);
        log.info("Patient updated - ID: {}", patientId);
        return toDTO(patient);
    }
    
    @Transactional
    public void deletePatient(Long patientId, String correlationId) {
        Patient patient = patientRepository.findById(patientId)
            .orElseThrow(() -> new RuntimeException("Patient not found"));
        
        // Hard delete - physically remove from database
        patientRepository.delete(patient);
        log.info("Patient hard deleted - ID: {}", patientId);
    }
    
    private PatientDTO toDTO(Patient patient) {
        PatientDTO dto = new PatientDTO();
        dto.setPatientId(patient.getPatientId());
        dto.setName(patient.getName());
        dto.setEmail(patient.getEmail());
        dto.setPhone(patient.getPhone());
        dto.setDob(patient.getDob());
        dto.setCreatedAt(patient.getCreatedAt());
        dto.setActive(patient.getActive());
        return dto;
    }
}


