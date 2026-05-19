package com.healthdesk.controller;

import com.healthdesk.service.GuestContentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/guest-content")
@PreAuthorize("hasRole('ADMIN')")
public class GuestContentController {
    private final GuestContentService guestContentService;

    public GuestContentController(GuestContentService guestContentService) {
        this.guestContentService = guestContentService;
    }

    @GetMapping
    public ResponseEntity<Map<String, String>> getContent() {
        return ResponseEntity.ok(guestContentService.getAll());
    }

    @PutMapping
    public ResponseEntity<Map<String, String>> updateContent(@RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(guestContentService.update(payload));
    }
}
