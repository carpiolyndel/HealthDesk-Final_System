package com.healthdesk.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String action;

    @Column(columnDefinition = "TEXT")
    private String details;

    private String ipAddress;
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }

    // Getters
    public String getId() { return id; }
    public String getUserId() { return userId; }
    public String getAction() { return action; }
    public String getDetails() { return details; }
    public String getIpAddress() { return ipAddress; }
    public LocalDateTime getTimestamp() { return timestamp; }

    // Setters
    public void setId(String id) { this.id = id; }
    public void setUserId(String userId) { this.userId = userId; }
    public void setAction(String action) { this.action = action; }
    public void setDetails(String details) { this.details = details; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}