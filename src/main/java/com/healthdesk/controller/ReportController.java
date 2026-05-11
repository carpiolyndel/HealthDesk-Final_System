package com.healthdesk.controller;

import com.healthdesk.dto.ActivityReportDTO;
import com.healthdesk.dto.UserReportDTO;
import com.healthdesk.security.CurrentUserService;
import com.healthdesk.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@PreAuthorize("hasAnyRole('ADMIN','DOCTOR')")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @Autowired
    private CurrentUserService currentUserService;

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserReportDTO> getUserReport() {
        return ResponseEntity.ok(reportService.getUserReport());
    }

    @GetMapping("/activity")
    public ResponseEntity<ActivityReportDTO> getActivityReport() {
        return ResponseEntity.ok(reportService.getActivityReport(currentUserService.getCurrentUser()));
    }
}
