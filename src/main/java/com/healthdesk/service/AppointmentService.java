package com.healthdesk.service;

import com.healthdesk.dto.AppointmentDTO;
import com.healthdesk.model.Appointment;
import com.healthdesk.model.AppointmentStatus;
import com.healthdesk.model.Patient;
import com.healthdesk.model.Role;
import com.healthdesk.model.User;
import com.healthdesk.repository.AppointmentRepository;
import com.healthdesk.repository.PatientRepository;
import com.healthdesk.repository.UserRepository;
import com.healthdesk.security.EncryptionUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PatientRepository patientRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private EncryptionUtil encryptionUtil;

    public List<AppointmentDTO> getAll(User actor) {
        return appointmentRepository.findAll().stream()
                .filter(appointment -> canViewAppointment(appointment, actor))
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<AppointmentDTO> getToday(User actor) {
        LocalDate today = LocalDate.now();
        return appointmentRepository
                .findByAppointmentDateTimeBetween(today.atStartOfDay(), today.plusDays(1).atStartOfDay())
                .stream()
                .filter(appointment -> canViewAppointment(appointment, actor))
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<AppointmentDTO> getUpcoming(User actor) {
        return appointmentRepository.findAll().stream()
                .filter(a -> a.getAppointmentDateTime().isAfter(LocalDateTime.now()) && a.getStatus() != AppointmentStatus.CANCELLED)
                .filter(appointment -> canViewAppointment(appointment, actor))
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public AppointmentDTO create(AppointmentDTO dto, User actor) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        User doctor = userRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found"));
        if (doctor.getRole() != Role.DOCTOR) {
            throw new IllegalArgumentException("Appointments must be assigned to a doctor.");
        }
        if (patient.getAssignedDoctor() == null) {
            patient.setAssignedDoctor(doctor);
        }
        if (patient.getAssignedNurse() == null) {
            userRepository.findByRole(Role.NURSE).stream().findFirst().ifPresent(patient::setAssignedNurse);
        }
        patientRepository.save(patient);
        User scheduledBy = actor;

        checkDoubleBooking(doctor.getId(), dto.getAppointmentDateTime(), null);

        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setScheduledBy(scheduledBy);
        appointment.setAppointmentDateTime(dto.getAppointmentDateTime());
        appointment.setReason(encryptNullable(dto.getReason()));
        appointment.setNotes(encryptNullable(dto.getNotes()));
        appointment.setStatus(AppointmentStatus.SCHEDULED);

        Appointment saved = appointmentRepository.save(appointment);
        auditLogService.logAction(actor.getId(), "CREATE_APPOINTMENT", "Created appointment: " + saved.getId());
        return toDTO(saved);
    }

    public AppointmentDTO cancel(String id, String reason, User actor) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));

        // FR-10: cancellation at least 1 day before.
        if (!appointment.getAppointmentDateTime().toLocalDate().isAfter(LocalDate.now())) {
            throw new IllegalStateException("Cancellation is only allowed at least 1 day before the appointment.");
        }
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("Cancellation reason is required.");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setCancellationReason(encryptNullable(reason));
        Appointment saved = appointmentRepository.save(appointment);
        auditLogService.logAction(actor.getId(), "CANCEL_APPOINTMENT", "Cancelled appointment: " + id);
        return toDTO(saved);
    }

    public AppointmentDTO reschedule(String id, String newDate, String newTime, String reason, User actor) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Appointment not found"));

        LocalDateTime newDateTime = LocalDateTime.of(
                LocalDate.parse(newDate),
                LocalTime.parse(newTime, DateTimeFormatter.ofPattern("HH:mm"))
        );

        if (!newDateTime.toLocalDate().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Reschedule date must be at least 1 day ahead.");
        }

        checkDoubleBooking(appointment.getDoctor().getId(), newDateTime, id);

        appointment.setAppointmentDateTime(newDateTime);
        appointment.setStatus(AppointmentStatus.RESCHEDULED);
        appointment.setNotes(encryptNullable(reason));
        Appointment saved = appointmentRepository.save(appointment);
        auditLogService.logAction(actor.getId(), "RESCHEDULE_APPOINTMENT", "Rescheduled appointment: " + id);
        return toDTO(saved);
    }

    public List<String> getTakenSlots(String doctorId, String date) {
        LocalDate target = LocalDate.parse(date);
        return appointmentRepository
                .findByAppointmentDateTimeBetweenAndDoctor(target.atStartOfDay(), target.plusDays(1).atStartOfDay(),
                        userRepository.findById(doctorId).orElseThrow(() -> new IllegalArgumentException("Doctor not found")))
                .stream()
                .filter(a -> a.getStatus() != AppointmentStatus.CANCELLED)
                .map(a -> a.getAppointmentDateTime().toLocalTime().toString())
                .collect(Collectors.toList());
    }

    private void checkDoubleBooking(String doctorId, LocalDateTime dateTime, String excludeId) {
        Optional<Appointment> conflict = appointmentRepository.findConflictingAppointment(doctorId, dateTime);
        if (conflict.isPresent() && (excludeId == null || !conflict.get().getId().equals(excludeId))) {
            throw new IllegalStateException("Selected time slot is already booked.");
        }
    }

    private boolean canViewAppointment(Appointment appointment, User actor) {
        if (actor.getRole() == Role.STAFF) {
            return true;
        }
        if (actor.getRole() == Role.DOCTOR) {
            return Objects.equals(appointment.getDoctor().getId(), actor.getId());
        }
        if (actor.getRole() == Role.NURSE) {
            Patient patient = appointment.getPatient();
            return patient.getAssignedNurse() != null
                    && Objects.equals(patient.getAssignedNurse().getId(), actor.getId());
        }
        return false;
    }

    private AppointmentDTO toDTO(Appointment appointment) {
        AppointmentDTO dto = new AppointmentDTO();
        dto.setId(appointment.getId());
        dto.setPatientId(appointment.getPatient().getId());
        dto.setDoctorId(appointment.getDoctor().getId());
        dto.setAppointmentDateTime(appointment.getAppointmentDateTime());
        dto.setReason(decryptNullable(appointment.getReason()));
        dto.setNotes(decryptNullable(appointment.getNotes()));
        dto.setStatus(appointment.getStatus().name());
        dto.setPatientName(patientName(appointment.getPatient()));
        dto.setDoctorName(appointment.getDoctor().getFullName());
        return dto;
    }

    private String patientName(Patient patient) {
        return (nullToEmpty(decryptNullable(patient.getFirstName())) + " "
                + nullToEmpty(decryptNullable(patient.getLastName()))).trim();
    }

    private String encryptNullable(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return encryptionUtil.encrypt(value);
        } catch (Exception e) {
            throw new RuntimeException("Failed to encrypt appointment field", e);
        }
    }

    private String decryptNullable(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return encryptionUtil.decrypt(value);
        } catch (Exception e) {
            return value;
        }
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }
}
