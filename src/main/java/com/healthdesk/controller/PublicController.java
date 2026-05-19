package com.healthdesk.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import java.util.*;
import com.healthdesk.model.Role;
import com.healthdesk.repository.UserRepository;
import com.healthdesk.service.GuestContentService;

@RestController
@RequestMapping("/api/public")
public class PublicController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GuestContentService guestContentService;

    @GetMapping("/clinic-info")
    public ResponseEntity<Map<String, String>> getClinicInfo() {
        return ResponseEntity.ok(guestContentService.getClinicInfo());
    }

    @GetMapping("/doctors")
    public ResponseEntity<List<Map<String, String>>> getDoctors() {
        List<Map<String, String>> doctors = new ArrayList<>();
        userRepository.findByRole(Role.DOCTOR).stream().filter(user -> user.isActive()).forEach(user -> {
            Map<String, String> doctor = new HashMap<>();
            doctor.put("id", user.getId());
            doctor.put("name", user.getFullName());
            doctor.put("specialty", hasText(user.getSpecialty()) ? user.getSpecialty() : "General Medicine");
            doctor.put("schedule", hasText(user.getSchedule()) ? user.getSchedule() : "Mon-Fri 9AM-5PM");
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
        return ResponseEntity.ok(guestContentService.getHours());
    }

    @GetMapping("/services")
    public ResponseEntity<List<String>> getServices() {
        return ResponseEntity.ok(guestContentService.getServices());
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
