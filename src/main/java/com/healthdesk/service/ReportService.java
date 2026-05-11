package com.healthdesk.service;

import com.healthdesk.dto.ActivityReportDTO;
import com.healthdesk.dto.UserReportDTO;
import com.healthdesk.model.AppointmentStatus;
import com.healthdesk.model.Patient;
import com.healthdesk.model.User;
import com.healthdesk.model.Role;
import com.healthdesk.repository.AppointmentRepository;
import com.healthdesk.repository.PatientRepository;
import com.healthdesk.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private PatientRepository patientRepository;

    public UserReportDTO getUserReport() {
        List<User> users = userRepository.findAll();
        UserReportDTO report = new UserReportDTO();
        report.setTotalUsers(users.size());
        report.setActiveUsers((int) users.stream().filter(User::isActive).count());
        report.setArchivedUsers((int) users.stream().filter(user -> !user.isActive()).count());

        Map<String, Integer> roleCounts = users.stream()
                .collect(Collectors.groupingBy(user -> user.getRole() != null ? user.getRole().name() : Role.STAFF.name(), Collectors.reducing(0, e -> 1, Integer::sum)));

        report.setUsersByRole(roleCounts);
        return report;
    }

    public ActivityReportDTO getActivityReport(User actor) {
        List<Patient> patients = patientRepository.findAll().stream()
                .filter(patient -> canIncludePatient(patient, actor))
                .collect(Collectors.toList());

        ActivityReportDTO report = new ActivityReportDTO();
        report.setTotalPatients(patients.size());
        report.setActivePatients((int) patients.stream().filter(patient -> !patient.isArchived()).count());
        report.setArchivedPatients((int) patients.stream().filter(Patient::isArchived).count());

        List<com.healthdesk.model.Appointment> appointments = appointmentRepository.findAll().stream()
                .filter(appointment -> patients.stream()
                        .anyMatch(patient -> Objects.equals(patient.getId(), appointment.getPatient().getId())))
                .collect(Collectors.toList());
        report.setTotalAppointments(appointments.size());
        report.setScheduledAppointments((int) appointments.stream().filter(a -> a.getStatus() == AppointmentStatus.SCHEDULED).count());
        report.setCompletedAppointments((int) appointments.stream().filter(a -> a.getStatus() == AppointmentStatus.COMPLETED).count());
        report.setCancelledAppointments((int) appointments.stream().filter(a -> a.getStatus() == AppointmentStatus.CANCELLED).count());
        report.setRescheduledAppointments((int) appointments.stream().filter(a -> a.getStatus() == AppointmentStatus.RESCHEDULED).count());
        report.setUpcomingAppointments((int) appointments.stream().filter(a -> a.getAppointmentDateTime().isAfter(LocalDateTime.now()) && a.getStatus() != AppointmentStatus.CANCELLED).count());

        Map<String, Integer> statusCounts = new HashMap<>();
        for (AppointmentStatus status : AppointmentStatus.values()) {
            statusCounts.put(status.name(), (int) appointments.stream().filter(a -> a.getStatus() == status).count());
        }
        report.setAppointmentsByStatus(statusCounts.entrySet().stream().collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue)));

        return report;
    }

    private boolean canIncludePatient(Patient patient, User actor) {
        if (actor.getRole() == Role.ADMIN) {
            return true;
        }
        if (actor.getRole() == Role.DOCTOR) {
            return patient.getAssignedDoctor() != null
                    && Objects.equals(patient.getAssignedDoctor().getId(), actor.getId());
        }
        return false;
    }
}
