package com.healthdesk.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "guest_content")
public class GuestContent {

    @Id
    @Column(name = "content_key", nullable = false, length = 80)
    private String key;

    @Column(columnDefinition = "TEXT")
    private String value;

    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        updatedAt = LocalDateTime.now();
    }

    public String getKey() { return key; }
    public String getValue() { return value; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void setKey(String key) { this.key = key; }
    public void setValue(String value) { this.value = value; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
