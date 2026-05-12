package com.healthdesk.controller;

import com.healthdesk.dto.PatientDTO;
import com.healthdesk.security.CurrentUserService;
import com.healthdesk.service.PatientService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    @Autowired
    private PatientService patientService;

    @Autowired
    private CurrentUserService currentUserService;

    @PostMapping
    @PreAuthorize("hasAnyRole('DOCTOR','NURSE','STAFF')")
    public ResponseEntity<PatientDTO> createPatient(@Valid @RequestBody PatientDTO patientDTO) {
        return ResponseEntity.ok(patientService.createPatient(patientDTO, currentUserService.getCurrentUser()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('DOCTOR','NURSE','STAFF')")
    public ResponseEntity<List<PatientDTO>> getPatients(@RequestParam(required = false, defaultValue = "") String search) {
        return ResponseEntity.ok(patientService.searchPatients(search, currentUserService.getCurrentUser()));
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('DOCTOR','NURSE','STAFF')")
    public ResponseEntity<List<PatientDTO>> searchPatients(@RequestParam(required = false) String term,
                                                           @RequestParam(required = false) String q) {
        String query = (q != null && !q.isBlank()) ? q : (term != null ? term : "");
        return ResponseEntity.ok(patientService.searchPatients(query, currentUserService.getCurrentUser()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR','NURSE')")
    public ResponseEntity<PatientDTO> getPatient(@PathVariable String id) {
        PatientDTO patient = patientService.getPatient(id, currentUserService.getCurrentUser());
        return patient != null ? ResponseEntity.ok(patient) : ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('DOCTOR','NURSE')")
    public ResponseEntity<PatientDTO> updatePatient(@PathVariable String id, @Valid @RequestBody PatientDTO patientDTO) {
        return ResponseEntity.ok(patientService.updatePatient(id, patientDTO, currentUserService.getCurrentUser()));
    }

    @PutMapping("/{id}/archive")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<Void> archivePatient(@PathVariable String id) {
        patientService.archivePatient(id, currentUserService.getCurrentUser());
        return ResponseEntity.ok().build();
    }
}
