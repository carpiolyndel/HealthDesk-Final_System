package com.healthdesk.dto;

public class CancelAppointmentDTO {
    private String cancellationReason;
    private String reason;

    public String getCancellationReason() {
        return (cancellationReason != null && !cancellationReason.isBlank()) ? cancellationReason : reason;
    }
    public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
