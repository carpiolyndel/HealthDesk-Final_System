package com.healthdesk.repository;

import com.healthdesk.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, String> {
    List<AuditLog> findByUserIdOrderByTimestampDesc(String userId);
    List<AuditLog> findByTimestampBetween(LocalDateTime start, LocalDateTime end);
}