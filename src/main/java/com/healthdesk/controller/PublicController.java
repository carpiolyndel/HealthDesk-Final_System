package com.healthdesk.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import java.util.*;
import com.healthdesk.model.Role;
import com.healthdesk.repository.UserRepository;

@RestController
@RequestMapping("/api/public")
public class PublicController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/clinic-info")
    public ResponseEntity<Map<String, String>> getClinicInfo() {
        Map<String, String> info = new HashMap<>();
        info.put("name", "HealthDesk Clinic");
        info.put("address", "Cawayan, Catarman, Northern Samar");
        info.put("phone", "09486729942");
        info.put("emergencyPhone", "09486729942");
        info.put("email", "healthdesk.info1@gmail.com");
        return ResponseEntity.ok(info);
    }

    @GetMapping("/doctors")
    public ResponseEntity<List<Map<String, String>>> getDoctors() {
        List<Map<String, String>> doctors = new ArrayList<>();
        userRepository.findByRole(Role.DOCTOR).forEach(user -> {
            Map<String, String> doctor = new HashMap<>();
            doctor.put("id", user.getId());
            doctor.put("name", user.getFullName());
            doctor.put("specialty", "General Medicine");
            doctor.put("schedule", "Mon-Fri 9AM-5PM");
            doctors.add(doctor);
        });

        return ResponseEntity.ok(doctors);
    }

    @GetMapping("/nurses")
    public ResponseEntity<List<Map<String, String>>> getNurses() {
        List<Map<String, String>> nurses = new ArrayList<>();
        userRepository.findByRole(Role.NURSE).stream()
                .filter(user -> user.isActive())
                .forEach(user -> {
                    Map<String, String> nurse = new HashMap<>();
                    nurse.put("id", user.getId());
                    nurse.put("name", user.getFullName());
                    nurse.put("email", user.getEmail());
                    nurses.add(nurse);
                });

        return ResponseEntity.ok(nurses);
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
