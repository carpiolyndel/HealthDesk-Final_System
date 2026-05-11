package com.healthdesk.dto;

import jakarta.validation.constraints.NotBlank;

public class LoginRequestDTO {
    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Password is required")
    private String password;

    private String otpCode;

    // Getters
    public String getUsername() { return username; }
    public String getPassword() { return password; }
    public String getOtpCode() { return otpCode; }

    // Setters
    public void setUsername(String username) { this.username = username; }
    public void setPassword(String password) { this.password = password; }
    public void setOtpCode(String otpCode) { this.otpCode = otpCode; }
}