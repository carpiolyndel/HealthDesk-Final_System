package com.healthdesk.controller;

import com.healthdesk.dto.LoginRequestDTO;
import com.healthdesk.dto.LoginResponseDTO;
import com.healthdesk.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO loginRequest,
                                                  HttpServletRequest request) {
        String ipAddress = request.getRemoteAddr();
        LoginResponseDTO response = authService.login(loginRequest, ipAddress);
        return ResponseEntity.ok(response);
    }
}
