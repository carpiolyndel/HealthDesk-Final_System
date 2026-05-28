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
        patient.setFirstName(encryptNullable(patientDTO.getFirstName()));
        patient.setLastName(encryptNullable(patientDTO.getLastName()));
        patient.setMiddleName(encryptNullable(patientDTO.getMiddleName()));
        patient.setAge(patientDTO.getAge());
        patient.setGender(encryptNullable(patientDTO.getGender()));
        patient.setEmail(encryptNullable(patientDTO.getEmail()));
        patient.setPhoneNumber(encryptNullable(patientDTO.getPhoneNumber()));
        patient.setAddress(encryptNullable(patientDTO.getAddress()));
        patient.setMedicalHistory(encryptNullable(patientDTO.getMedicalHistory()));
        patient.setPreviousDiagnoses(encryptNullable(patientDTO.getPreviousDiagnoses()));
        patient.setBloodType(encryptNullable(patientDTO.getBloodType()));
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

        return convertToDTO(saved, actor);
    }

    public List<PatientDTO> searchPatients(String searchTerm, User actor) {
        return patientRepository.findAll().stream()
                .filter(patient -> canViewPatient(patient, actor))
                .filter(patient -> matchesPatientSearch(patient, searchTerm))
                .map(patient -> convertToDTO(patient, actor))
                .collect(Collectors.toList());
    }

    public PatientDTO getPatient(String id, User actor) {
        Patient patient = patientRepository.findById(id).orElse(null);
        if (patient != null && !canViewPatient(patient, actor)) {
            throw new IllegalStateException("You can only access assigned patient records.");
        }
        return patient != null ? convertToDTO(patient, actor) : null;
    }

    public PatientDTO updatePatient(String id, PatientDTO patientDTO, User actor) {
        Patient patient = patientRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Patient not found"));

        if (!canUpdatePatient(patient, actor)) {
            throw new IllegalStateException("You can only update assigned patient records.");
        }

        patient.setFirstName(encryptNullable(patientDTO.getFirstName()));
        patient.setLastName(encryptNullable(patientDTO.getLastName()));
        patient.setMiddleName(encryptNullable(patientDTO.getMiddleName()));
        patient.setAge(patientDTO.getAge());
        patient.setGender(encryptNullable(patientDTO.getGender()));
        patient.setEmail(encryptNullable(patientDTO.getEmail()));
        patient.setPhoneNumber(encryptNullable(patientDTO.getPhoneNumber()));
        patient.setAddress(encryptNullable(patientDTO.getAddress()));
        patient.setBloodType(encryptNullable(patientDTO.getBloodType()));

        if (actor.getRole() != Role.STAFF) {
            patient.setMedicalHistory(encryptNullable(patientDTO.getMedicalHistory()));
            patient.setPreviousDiagnoses(encryptNullable(patientDTO.getPreviousDiagnoses()));
            patient.setAllergies(encryptNullable(patientDTO.getAllergies()));
            patient.setCurrentMedications(encryptNullable(patientDTO.getCurrentMedications()));
        }

        if (actor.getRole() == Role.DOCTOR) {
            if (patientDTO.getAssignedNurseId() == null || patientDTO.getAssignedNurseId().isBlank()) {
                patient.setAssignedNurse(null);
            } else {
                User nurse = userRepository.findById(patientDTO.getAssignedNurseId())
                        .orElseThrow(() -> new IllegalArgumentException("Assigned nurse not found."));
                if (nurse.getRole() != Role.NURSE) {
                    throw new IllegalArgumentException("Assigned nurse must have the NURSE role.");
                }
                patient.setAssignedNurse(nurse);
            }
        }

        Patient updated = patientRepository.save(patient);
        auditLogService.logAction(actor.getId(), "UPDATE_PATIENT", "Updated patient: " + updated.getId());
        return convertToDTO(updated, actor);
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
        if (actor.getRole() == Role.STAFF) {
            return true;
        }
        return false;
    }

    private boolean canUpdatePatient(Patient patient, User actor) {
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

    private PatientDTO convertToDTO(Patient patient) {
        return convertToDTO(patient, null);
    }

    private PatientDTO convertToDTO(Patient patient, User actor) {
        PatientDTO dto = new PatientDTO();
        dto.setId(patient.getId());
        dto.setFirstName(decryptNullable(patient.getFirstName()));
        dto.setLastName(decryptNullable(patient.getLastName()));
        dto.setMiddleName(decryptNullable(patient.getMiddleName()));
        dto.setAge(patient.getAge());
        dto.setGender(decryptNullable(patient.getGender()));
        dto.setEmail(decryptNullable(patient.getEmail()));
        dto.setPhoneNumber(decryptNullable(patient.getPhoneNumber()));
        dto.setAddress(decryptNullable(patient.getAddress()));
        dto.setBloodType(decryptNullable(patient.getBloodType()));
        boolean canSeeMedical = actor == null || actor.getRole() == Role.DOCTOR || actor.getRole() == Role.NURSE;
        if (canSeeMedical) {
            dto.setMedicalHistory(decryptNullable(patient.getMedicalHistory()));
            dto.setPreviousDiagnoses(decryptNullable(patient.getPreviousDiagnoses()));
            dto.setAllergies(decryptNullable(patient.getAllergies()));
            dto.setCurrentMedications(decryptNullable(patient.getCurrentMedications()));
        }
        if (patient.getAssignedDoctor() != null) {
            dto.setAssignedDoctorId(patient.getAssignedDoctor().getId());
            dto.setAssignedDoctorName(patient.getAssignedDoctor().getFullName());
        }
        if (patient.getAssignedNurse() != null) {
            dto.setAssignedNurseId(patient.getAssignedNurse().getId());
            dto.setAssignedNurseName(patient.getAssignedNurse().getFullName());
        }
        return dto;
    }

    private boolean matchesPatientSearch(Patient patient, String searchTerm) {
        if (searchTerm == null || searchTerm.isBlank()) return true;
        String lowerSearch = searchTerm.toLowerCase();
        String searchable = String.join(" ",
                nullToEmpty(patient.getId()),
                nullToEmpty(decryptNullable(patient.getFirstName())),
                nullToEmpty(decryptNullable(patient.getLastName())),
                nullToEmpty(decryptNullable(patient.getMiddleName())),
                nullToEmpty(decryptNullable(patient.getEmail())),
                nullToEmpty(decryptNullable(patient.getPhoneNumber()))
        ).toLowerCase();
        return searchable.contains(lowerSearch);
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
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
