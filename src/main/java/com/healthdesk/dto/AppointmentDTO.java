package com.healthdesk.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

public class AppointmentDTO {
    private String id;

    @NotBlank(message = "Patient ID is required")
    private String patientId;

    @NotBlank(message = "Doctor ID is required")
    private String doctorId;

    @NotNull(message = "Appointment date and time is required")
    @Future(message = "Appointment must be in the future")
    private LocalDateTime appointmentDateTime;

    private String reason;
    private String notes;
    private String status;

    // Getters
    public String getId() { return id; }
    public String getPatientId() { return patientId; }
    public String getDoctorId() { return doctorId; }
    public LocalDateTime getAppointmentDateTime() { return appointmentDateTime; }
    public String getReason() { return reason; }
    public String getNotes() { return notes; }
    public String getStatus() { return status; }

    // Setters
    public void setId(String id) { this.id = id; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    public void setDoctorId(String doctorId) { this.doctorId = doctorId; }
    public void setAppointmentDateTime(LocalDateTime appointmentDateTime) { this.appointmentDateTime = appointmentDateTime; }
    public void setReason(String reason) { this.reason = reason; }
    public void setNotes(String notes) { this.notes = notes; }
    public void setStatus(String status) { this.status = status; }
}