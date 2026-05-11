package com.healthdesk.dto;

import jakarta.validation.constraints.NotBlank;

public class RescheduleAppointmentDTO {
    @NotBlank(message = "New date is required")
    private String newDate;

    @NotBlank(message = "New time is required")
    private String newTime;

    private String reason;

    public String getNewDate() { return newDate; }
    public void setNewDate(String newDate) { this.newDate = newDate; }
    public String getNewTime() { return newTime; }
    public void setNewTime(String newTime) { this.newTime = newTime; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
