package com.healthdesk.controller;

import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/public")
public class CustomerInquiryController {

    private List<Map<String, Object>> inquiries = new ArrayList<>();

    @PostMapping("/customer-inquiries")
    public Map<String, String> saveInquiry(@RequestBody Map<String, Object> inquiry) {
        inquiry.put("receivedAt", LocalDateTime.now().toString());
        inquiries.add(inquiry);
        Map<String, String> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "Inquiry received");
        return response;
    }

    @GetMapping("/customer-inquiries")
    public List<Map<String, Object>> getInquiries() {
        return inquiries;
    }
}
