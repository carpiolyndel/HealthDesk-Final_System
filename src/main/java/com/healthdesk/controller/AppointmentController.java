package com.healthdesk.controller;

import com.healthdesk.dto.AppointmentDTO;
import com.healthdesk.dto.CancelAppointmentDTO;
import com.healthdesk.dto.RescheduleAppointmentDTO;
import com.healthdesk.security.CurrentUserService;
import com.healthdesk.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    @Autowired
    private CurrentUserService currentUserService;

    @GetMapping
    @PreAuthorize("hasAnyRole('DOCTOR','NURSE','STAFF')")
    public ResponseEntity<List<AppointmentDTO>> getAppointments() {
        return ResponseEntity.ok(appointmentService.getAll(currentUserService.getCurrentUser()));
    }

    @GetMapping("/today")
    @PreAuthorize("hasAnyRole('DOCTOR','NURSE','STAFF')")
    public ResponseEntity<List<AppointmentDTO>> getTodayAppointments() {
        return ResponseEntity.ok(appointmentService.getToday(currentUserService.getCurrentUser()));
    }

    @GetMapping("/upcoming")
    @PreAuthorize("hasAnyRole('DOCTOR','NURSE','STAFF')")
    public ResponseEntity<List<AppointmentDTO>> getUpcomingAppointments() {
        return ResponseEntity.ok(appointmentService.getUpcoming(currentUserService.getCurrentUser()));
    }

    @PostMapping
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<AppointmentDTO> createAppointment(@Valid @RequestBody AppointmentDTO appointmentDTO) {
        return ResponseEntity.ok(appointmentService.create(appointmentDTO, currentUserService.getCurrentUser()));
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<AppointmentDTO> cancelAppointment(@PathVariable String id,
                                                            @Valid @RequestBody CancelAppointmentDTO cancelDTO) {
        return ResponseEntity.ok(appointmentService.cancel(id, cancelDTO.getCancellationReason(), currentUserService.getCurrentUser()));
    }

    @PutMapping("/{id}/reschedule")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<AppointmentDTO> rescheduleAppointment(@PathVariable String id,
                                                                @Valid @RequestBody RescheduleAppointmentDTO dto) {
        return ResponseEntity.ok(appointmentService.reschedule(id, dto.getNewDate(), dto.getNewTime(), dto.getReason(), currentUserService.getCurrentUser()));
    }

    @GetMapping("/slots")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<Map<String, List<String>>> getTakenSlots(@RequestParam String doctorId, @RequestParam String date) {
        return ResponseEntity.ok(Map.of("takenSlots", appointmentService.getTakenSlots(doctorId, date)));
    }
}
