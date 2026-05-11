package com.healthdesk.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @OneToOne
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @Column(nullable = false, unique = true)
    private String token;

    @Column(nullable = false)
    private LocalDateTime expiryDate;

    private boolean revoked = false;

    // Getters
    public String getId() { return id; }
    public User getUser() { return user; }
    public String getToken() { return token; }
    public LocalDateTime getExpiryDate() { return expiryDate; }
    public boolean isRevoked() { return revoked; }

    // Setters
    public void setId(String id) { this.id = id; }
    public void setUser(User user) { this.user = user; }
    public void setToken(String token) { this.token = token; }
    public void setExpiryDate(LocalDateTime expiryDate) { this.expiryDate = expiryDate; }
    public void setRevoked(boolean revoked) { this.revoked = revoked; }
}