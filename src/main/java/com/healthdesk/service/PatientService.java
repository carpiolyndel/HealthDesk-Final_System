package com.healthdesk.service;

import com.healthdesk.dto.PatientDTO;
import com.healthdesk.model.Patient;
import com.healthdesk.model.Role;
import com.healthdesk.model.User;
import com.healthdesk.repository.PatientRepository;
import com.healthdesk.repository.UserRepository;
import com.healthdesk.security.EncryptionUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class PatientService {

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private EncryptionUtil encryptionUtil;

    public PatientDTO createPatient(PatientDTO patientDTO, User actor) {
        Patient patient = new Patient();
        patient.setFirstName(patientDTO.getFirstName());
        patient.setLastName(patientDTO.getLastName());
        patient.setMiddleName(patientDTO.getMiddleName());
        patient.setAge(patientDTO.getAge());
        patient.setGender(patientDTO.getGender());
        patient.setEmail(patientDTO.getEmail());
        patient.setPhoneNumber(patientDTO.getPhoneNumber());
        patient.setAddress(patientDTO.getAddress());
        patient.setMedicalHistory(encryptNullable(patientDTO.getMedicalHistory()));
        patient.setPreviousDiagnoses(encryptNullable(patientDTO.getPreviousDiagnoses()));
        patient.setBloodType(patientDTO.getBloodType());
        patient.setAllergies(encryptNullable(patientDTO.getAllergies()));
        patient.setCurrentMedications(encryptNullable(patientDTO.getCurrentMedications()));

        // Staff can register patients but should not populate medical records.
        if (actor.getRole() == Role.STAFF) {
            patient.setMedicalHistory(null);
            patient.setPreviousDiagnoses(null);
            patient.setAllergies(null);
            patient.setCurrentMedications(null);
        }

        if (patientDTO.getAssignedDoctorId() != null) {
            User doctor = userRepository.findById(patientDTO.getAssignedDoctorId()).orElse(null);
            if (doctor != null && doctor.getRole() != Role.DOCTOR) {
                throw new IllegalArgumentException("Assigned doctor must have the DOCTOR role.");
            }
            patient.setAssignedDoctor(doctor);
        }
        if (patientDTO.getAssignedNurseId() != null) {
            User nurse = userRepository.findById(patientDTO.getAssignedNurseId()).orElse(null);
            if (nurse != null && nurse.getRole() != Role.NURSE) {
                throw new IllegalArgumentException("Assigned nurse must have the NURSE role.");
            }
            patient.setAssignedNurse(nurse);
        }

        Patient saved = patientRepository.save(patient);
        auditLogService.logAction(actor.getId(), "CREATE_PATIENT", "Created patient: " + saved.getId());

        return convertToDTO(saved);
    }

    public List<PatientDTO> searchPatients(String searchTerm, User actor) {
        return patientRepository.searchByNameOrId(searchTerm).stream()
                .filter(patient -> canViewPatient(patient, actor))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public PatientDTO getPatient(String id, User actor) {
        Patient patient = patientRepository.findById(id).orElse(null);
        if (patient != null && !canViewPatient(patient, actor)) {
            throw new IllegalStateException("You can only access assigned patient records.");
        }
        return patient != null ? convertToDTO(patient) : null;
    }

    public PatientDTO updatePatient(String id, PatientDTO patientDTO, User actor) {
        Patient patient = patientRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Patient not found"));

        if (!canUpdatePatient(patient, actor)) {
            throw new IllegalStateException("You can only update assigned patient records.");
        }

        patient.setFirstName(patientDTO.getFirstName());
        patient.setLastName(patientDTO.getLastName());
        patient.setMiddleName(patientDTO.getMiddleName());
        patient.setAge(patientDTO.getAge());
        patient.setGender(patientDTO.getGender());
        patient.setEmail(patientDTO.getEmail());
        patient.setPhoneNumber(patientDTO.getPhoneNumber());
        patient.setAddress(patientDTO.getAddress());

        if (actor.getRole() != Role.STAFF) {
            patient.setMedicalHistory(encryptNullable(patientDTO.getMedicalHistory()));
            patient.setPreviousDiagnoses(encryptNullable(patientDTO.getPreviousDiagnoses()));
            patient.setAllergies(encryptNullable(patientDTO.getAllergies()));
            patient.setCurrentMedications(encryptNullable(patientDTO.getCurrentMedications()));
        }

        Patient updated = patientRepository.save(patient);
        auditLogService.logAction(actor.getId(), "UPDATE_PATIENT", "Updated patient: " + updated.getId());
        return convertToDTO(updated);
    }

    public void archivePatient(String id, User actor) {
        Patient patient = patientRepository.findById(id).orElse(null);
        if (patient != null) {
            if (!canUpdatePatient(patient, actor)) {
                throw new IllegalStateException("You can only archive assigned patient records.");
            }
            patient.setArchived(true);
            patientRepository.save(patient);
            auditLogService.logAction(actor.getId(), "ARCHIVE_PATIENT", "Archived patient: " + id);
        }
    }

    private boolean canViewPatient(Patient patient, User actor) {
        if (actor.getRole() == Role.DOCTOR) {
            return patient.getAssignedDoctor() != null
                    && Objects.equals(patient.getAssignedDoctor().getId(), actor.getId());
        }
        if (actor.getRole() == Role.NURSE) {
            return patient.getAssignedNurse() != null
                    && Objects.equals(patient.getAssignedNurse().getId(), actor.getId());
        }
        return false;
    }

    private boolean canUpdatePatient(Patient patient, User actor) {
        return canViewPatient(patient, actor);
    }

    private PatientDTO convertToDTO(Patient patient) {
        PatientDTO dto = new PatientDTO();
        dto.setId(patient.getId());
        dto.setFirstName(patient.getFirstName());
        dto.setLastName(patient.getLastName());
        dto.setMiddleName(patient.getMiddleName());
        dto.setAge(patient.getAge());
        dto.setGender(patient.getGender());
        dto.setEmail(patient.getEmail());
        dto.setPhoneNumber(patient.getPhoneNumber());
        dto.setAddress(patient.getAddress());
        dto.setMedicalHistory(decryptNullable(patient.getMedicalHistory()));
        dto.setPreviousDiagnoses(decryptNullable(patient.getPreviousDiagnoses()));
        dto.setBloodType(patient.getBloodType());
        dto.setAllergies(decryptNullable(patient.getAllergies()));
        dto.setCurrentMedications(decryptNullable(patient.getCurrentMedications()));
        if (patient.getAssignedDoctor() != null) {
            dto.setAssignedDoctorId(patient.getAssignedDoctor().getId());
        }
        if (patient.getAssignedNurse() != null) {
            dto.setAssignedNurseId(patient.getAssignedNurse().getId());
        }
        return dto;
    }

    private String encryptNullable(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return encryptionUtil.encrypt(value);
        } catch (Exception e) {
            throw new RuntimeException("Failed to encrypt patient field", e);
        }
    }

    private String decryptNullable(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return encryptionUtil.decrypt(value);
        } catch (Exception e) {
            // Fallback for old plaintext rows to avoid hard failures during migration.
            return value;
        }
    }
}
