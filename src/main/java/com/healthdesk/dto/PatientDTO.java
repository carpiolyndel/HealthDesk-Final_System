package com.healthdesk.dto;

import jakarta.validation.constraints.*;

public class PatientDTO {
    private String id;

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    private String middleName;

    @NotNull(message = "Age is required")
    @Min(value = 0, message = "Age must be 0 or greater")
    @Max(value = 150, message = "Age must be less than 150")
    private Integer age;

    @NotBlank(message = "Gender is required")
    private String gender;

    @Email(message = "Invalid email format")
    private String email;

    private String phoneNumber;
    private String address;
    private String medicalHistory;
    private String previousDiagnoses;
    private String bloodType;
    private String allergies;
    private String currentMedications;
    private String assignedDoctorId;
    private String assignedNurseId;
    private String assignedDoctorName;
    private String assignedNurseName;

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
    public String getAssignedDoctorId() { return assignedDoctorId; }
    public String getAssignedNurseId() { return assignedNurseId; }
    public String getAssignedDoctorName() { return assignedDoctorName; }
    public String getAssignedNurseName() { return assignedNurseName; }

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
    public void setAssignedDoctorId(String assignedDoctorId) { this.assignedDoctorId = assignedDoctorId; }
    public void setAssignedNurseId(String assignedNurseId) { this.assignedNurseId = assignedNurseId; }
    public void setAssignedDoctorName(String assignedDoctorName) { this.assignedDoctorName = assignedDoctorName; }
    public void setAssignedNurseName(String assignedNurseName) { this.assignedNurseName = assignedNurseName; }
}
