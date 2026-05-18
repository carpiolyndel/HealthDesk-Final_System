package com.healthdesk.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Entity
@Table(name = "customer_inquiries")
public class CustomerInquiry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    private String email;
    private String phone;

    @Column(nullable = false)
    private String subject;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String message;

    private String source;

    @Column(nullable = false)
    private String status;

    @Column(columnDefinition = "TEXT")
    private String replyMessage;

    private String repliedBy;
    private LocalDateTime repliedAt;
    private LocalDateTime receivedAt;

    @PrePersist
    protected void onCreate() {
        if (receivedAt == null) {
            receivedAt = LocalDateTime.now(ZoneOffset.UTC);
        }
        if (status == null || status.isBlank()) {
            status = "pending";
        }
        if (subject == null || subject.isBlank()) {
            subject = "General Inquiry";
        }
        if (name == null || name.isBlank()) {
            name = "Guest Visitor";
        }
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getSubject() { return subject; }
    public String getMessage() { return message; }
    public String getSource() { return source; }
    public String getStatus() { return status; }
    public String getReplyMessage() { return replyMessage; }
    public String getRepliedBy() { return repliedBy; }
    public LocalDateTime getRepliedAt() { return repliedAt; }
    public LocalDateTime getReceivedAt() { return receivedAt; }

    public void setId(String id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setEmail(String email) { this.email = email; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setSubject(String subject) { this.subject = subject; }
    public void setMessage(String message) { this.message = message; }
    public void setSource(String source) { this.source = source; }
    public void setStatus(String status) { this.status = status; }
    public void setReplyMessage(String replyMessage) { this.replyMessage = replyMessage; }
    public void setRepliedBy(String repliedBy) { this.repliedBy = repliedBy; }
    public void setRepliedAt(LocalDateTime repliedAt) { this.repliedAt = repliedAt; }
    public void setReceivedAt(LocalDateTime receivedAt) { this.receivedAt = receivedAt; }
}
