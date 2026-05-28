package com.healthdesk.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "patients")
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String firstName;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String lastName;

    @Column(columnDefinition = "TEXT")
    private String middleName;

    @Column(nullable = false)
    private Integer age;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String gender;

    @Column(unique = true)
    private String email;

    @Column(columnDefinition = "TEXT")
    private String phoneNumber;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(columnDefinition = "TEXT")
    private String medicalHistory;

    @Column(columnDefinition = "TEXT")
    private String previousDiagnoses;

    @Column(columnDefinition = "TEXT")
    private String bloodType;

    @Column(columnDefinition = "TEXT")
    private String allergies;

    @Column(columnDefinition = "TEXT")
    private String currentMedications;

    @ManyToOne
    @JoinColumn(name = "assigned_doctor_id")
    private User assignedDoctor;

    @ManyToOne
    @JoinColumn(name = "assigned_nurse_id")
    private User assignedNurse;

    @OneToMany(mappedBy = "patient", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Appointment> appointments = new ArrayList<>();

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
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getMiddleName() { return middleName; }
    public Integer getAge() { return age; }
    public String getGender() { return gender; }
    public String getEmail() { return email; }
    public String getPhoneNumber() { return phoneNumber; }
    public String getAddress() { return address; }
    public String getMedicalHistory() { return medicalHistory; }
    public String getPreviousDiagnoses() { return previousDiagnoses; }
    public String getBloodType() { return bloodType; }
    public String getAllergies() { return allergies; }
    public String getCurrentMedications() { return currentMedications; }
    public User getAssignedDoctor() { return assignedDoctor; }
    public User getAssignedNurse() { return assignedNurse; }
    public List<Appointment> getAppointments() { return appointments; }
    public boolean isArchived() { return isArchived; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // Setters
    public void setId(String id) { this.id = id; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public void setMiddleName(String middleName) { this.middleName = middleName; }
    public void setAge(Integer age) { this.age = age; }
    public void setGender(String gender) { this.gender = gender; }
    public void setEmail(String email) { this.email = email; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public void setAddress(String address) { this.address = address; }
    public void setMedicalHistory(String medicalHistory) { this.medicalHistory = medicalHistory; }
    public void setPreviousDiagnoses(String previousDiagnoses) { this.previousDiagnoses = previousDiagnoses; }
    public void setBloodType(String bloodType) { this.bloodType = bloodType; }
    public void setAllergies(String allergies) { this.allergies = allergies; }
    public void setCurrentMedications(String currentMedications) { this.currentMedications = currentMedications; }
    public void setAssignedDoctor(User assignedDoctor) { this.assignedDoctor = assignedDoctor; }
    public void setAssignedNurse(User assignedNurse) { this.assignedNurse = assignedNurse; }
    public void setAppointments(List<Appointment> appointments) { this.appointments = appointments; }
    public void setArchived(boolean archived) { isArchived = archived; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getFullName() {
        return firstName + " " + (middleName != null ? middleName + " " : "") + lastName;
    }
}
