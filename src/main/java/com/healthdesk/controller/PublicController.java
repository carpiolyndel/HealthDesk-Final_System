package com.healthdesk.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import java.util.*;

@RestController
@RequestMapping("/api/public")
public class PublicController {

    @GetMapping("/clinic-info")
    public ResponseEntity<Map<String, String>> getClinicInfo() {
        Map<String, String> info = new HashMap<>();
        info.put("name", "HealthDesk Clinic");
        info.put("address", "123 Health Street, Manila");
        info.put("phone", "(02) 1234-5678");
        info.put("email", "info@healthdesk.com");
        return ResponseEntity.ok(info);
    }

    @GetMapping("/doctors")
    public ResponseEntity<List<Map<String, String>>> getDoctors() {
        List<Map<String, String>> doctors = new ArrayList<>();
        Map<String, String> doctor1 = new HashMap<>();
        doctor1.put("name", "Dr. Juan Dela Cruz");
        doctor1.put("specialty", "Cardiology");
        doctor1.put("schedule", "Mon-Fri 9AM-5PM");
        doctors.add(doctor1);

        Map<String, String> doctor2 = new HashMap<>();
        doctor2.put("name", "Dr. Maria Santos");
        doctor2.put("specialty", "Pediatrics");
        doctor2.put("schedule", "Mon-Wed 10AM-6PM");
        doctors.add(doctor2);

        return ResponseEntity.ok(doctors);
    }

    @GetMapping("/hours")
    public ResponseEntity<Map<String, String>> getClinicHours() {
        Map<String, String> hours = new HashMap<>();
        hours.put("monday_friday", "8:00 AM - 8:00 PM");
        hours.put("saturday", "9:00 AM - 5:00 PM");
        hours.put("sunday", "Closed");
        return ResponseEntity.ok(hours);
    }

    @GetMapping("/services")
    public ResponseEntity<List<String>> getServices() {
        List<String> services = Arrays.asList(
                "General Consultation",
                "Vaccination",
                "Laboratory Tests",
                "Dental Checkup",
                "Annual Physical Exam"
        );
        return ResponseEntity.ok(services);
    }
}
