package com.healthdesk.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne
    @JoinColumn(name = "doctor_id", nullable = false)
    private User doctor;

    @ManyToOne
    @JoinColumn(name = "scheduled_by_id", nullable = false)
    private User scheduledBy;

    @Column(nullable = false)
    private LocalDateTime appointmentDateTime;

    @Enumerated(EnumType.STRING)
    private AppointmentStatus status = AppointmentStatus.SCHEDULED;

    private String reason;
    private String cancellationReason;
    private String notes;
    private boolean isArchived = false;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters
    public String getId() { return id; }
    public Patient getPatient() { return patient; }
    public User getDoctor() { return doctor; }
    public User getScheduledBy() { return scheduledBy; }
    public LocalDateTime getAppointmentDateTime() { return appointmentDateTime; }
    public AppointmentStatus getStatus() { return status; }
    public String getReason() { return reason; }
    public String getCancellationReason() { return cancellationReason; }
    public String getNotes() { return notes; }
    public boolean isArchived() { return isArchived; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // Setters
    public void setId(String id) { this.id = id; }
    public void setPatient(Patient patient) { this.patient = patient; }
    public void setDoctor(User doctor) { this.doctor = doctor; }
    public void setScheduledBy(User scheduledBy) { this.scheduledBy = scheduledBy; }
    public void setAppointmentDateTime(LocalDateTime appointmentDateTime) { this.appointmentDateTime = appointmentDateTime; }
    public void setStatus(AppointmentStatus status) { this.status = status; }
    public void setReason(String reason) { this.reason = reason; }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }
    public void setNotes(String notes) { this.notes = notes; }
    public void setArchived(boolean archived) { isArchived = archived; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}