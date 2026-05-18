package com.healthdesk.controller;

import com.healthdesk.model.CustomerInquiry;
import com.healthdesk.repository.CustomerInquiryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/public")
public class CustomerInquiryController {

    private static final DateTimeFormatter DISPLAY_DATE = DateTimeFormatter.ofPattern("MMM d, yyyy h:mm a");
    private static final ZoneId APP_ZONE = ZoneId.of("Asia/Manila");
    private static final ZoneOffset STORAGE_ZONE = ZoneOffset.UTC;

    @Autowired
    private CustomerInquiryRepository customerInquiryRepository;

    @PostMapping("/customer-inquiries")
    public Map<String, String> saveInquiry(@RequestBody Map<String, Object> inquiry) {
        LocalDateTime now = LocalDateTime.now(STORAGE_ZONE);
        CustomerInquiry savedInquiry = new CustomerInquiry();
        savedInquiry.setName(stringValue(inquiry.get("name"), "Guest Visitor"));
        savedInquiry.setEmail(stringValue(inquiry.get("email"), ""));
        savedInquiry.setPhone(stringValue(inquiry.get("phone"), ""));
        savedInquiry.setSubject(stringValue(inquiry.get("subject"), "General Inquiry"));
        savedInquiry.setMessage(stringValue(inquiry.get("message"), ""));
        savedInquiry.setSource(stringValue(inquiry.get("source"), "guest"));
        savedInquiry.setStatus("pending");
        savedInquiry.setReceivedAt(now);
        customerInquiryRepository.save(savedInquiry);

        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Inquiry received");
        return response;
    }

    @GetMapping("/customer-inquiries")
    public List<Map<String, Object>> getInquiries() {
        return customerInquiryRepository.findAllByOrderByReceivedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @PutMapping("/customer-inquiries/{id}/reply")
    public Map<String, Object> replyToInquiry(@PathVariable String id, @RequestBody Map<String, Object> payload) {
        CustomerInquiry inquiry = customerInquiryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inquiry not found"));
        inquiry.setReplyMessage(stringValue(payload.get("replyMessage"), ""));
        inquiry.setRepliedBy(stringValue(payload.get("repliedBy"), "HealthDesk Admin"));
        inquiry.setRepliedAt(LocalDateTime.now(STORAGE_ZONE));
        inquiry.setStatus("replied");
        return toResponse(customerInquiryRepository.save(inquiry));
    }

    @DeleteMapping("/customer-inquiries/{id}")
    public Map<String, String> deleteInquiry(@PathVariable String id) {
        if (!customerInquiryRepository.existsById(id)) {
            throw new RuntimeException("Inquiry not found");
        }
        customerInquiryRepository.deleteById(id);
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Inquiry deleted");
        return response;
    }

    private String stringValue(Object value, String fallback) {
        if (value == null) {
            return fallback;
        }
        String text = value.toString().trim();
        return text.isEmpty() ? fallback : text;
    }

    private Map<String, Object> toResponse(CustomerInquiry inquiry) {
        Map<String, Object> response = new LinkedHashMap<>();
        LocalDateTime receivedAt = inquiry.getReceivedAt();
        response.put("id", inquiry.getId());
        response.put("name", inquiry.getName());
        response.put("email", inquiry.getEmail());
        response.put("phone", inquiry.getPhone());
        response.put("subject", inquiry.getSubject());
        response.put("message", inquiry.getMessage());
        response.put("source", inquiry.getSource());
        response.put("status", inquiry.getStatus());
        response.put("replyMessage", inquiry.getReplyMessage());
        response.put("repliedBy", inquiry.getRepliedBy());
        response.put("repliedAt", inquiry.getRepliedAt() == null ? "" : toUtcIso(inquiry.getRepliedAt()));
        response.put("date", receivedAt == null ? "" : formatForDisplay(receivedAt));
        response.put("receivedAt", receivedAt == null ? "" : toUtcIso(receivedAt));
        return response;
    }

    private String formatForDisplay(LocalDateTime dateTime) {
        return dateTime.atZone(STORAGE_ZONE).withZoneSameInstant(APP_ZONE).format(DISPLAY_DATE);
    }

    private String toUtcIso(LocalDateTime dateTime) {
        return dateTime.atZone(STORAGE_ZONE).toInstant().toString();
    }
}
