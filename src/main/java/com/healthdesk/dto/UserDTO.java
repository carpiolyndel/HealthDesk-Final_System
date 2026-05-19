package com.healthdesk.dto;

public class UserDTO {
    private String id;
    private String username;
    private String email;
    private String password;
    private String fullName;
    private String phoneNumber;
    private String licenseNumber;
    private String employeeId;
    private String specialty;
    private String schedule;
    private String role;

    // Getters
    public String getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getPassword() { return password; }
    public String getFullName() { return fullName; }
    public String getPhoneNumber() { return phoneNumber; }
    public String getLicenseNumber() { return licenseNumber; }
    public String getEmployeeId() { return employeeId; }
    public String getSpecialty() { return specialty; }
    public String getSchedule() { return schedule; }
    public String getRole() { return role; }

    // Setters
    public void setId(String id) { this.id = id; }
    public void setUsername(String username) { this.username = username; }
    public void setEmail(String email) { this.email = email; }
    public void setPassword(String password) { this.password = password; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
    public void setSpecialty(String specialty) { this.specialty = specialty; }
    public void setSchedule(String schedule) { this.schedule = schedule; }
    public void setRole(String role) { this.role = role; }
}
