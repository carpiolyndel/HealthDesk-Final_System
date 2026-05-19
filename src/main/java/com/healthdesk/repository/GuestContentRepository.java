package com.healthdesk.repository;

import com.healthdesk.model.GuestContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GuestContentRepository extends JpaRepository<GuestContent, String> {
}
