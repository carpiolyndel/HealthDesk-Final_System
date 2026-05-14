package com.healthdesk.repository;

import com.healthdesk.model.CustomerInquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CustomerInquiryRepository extends JpaRepository<CustomerInquiry, String> {
    List<CustomerInquiry> findAllByOrderByReceivedAtDesc();
}
