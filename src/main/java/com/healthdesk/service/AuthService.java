package com.healthdesk.service;

import com.healthdesk.dto.LoginRequestDTO;
import com.healthdesk.dto.LoginResponseDTO;
import com.healthdesk.model.RefreshToken;
import com.healthdesk.model.User;
import com.healthdesk.repository.RefreshTokenRepository;
import com.healthdesk.repository.UserRepository;
import com.healthdesk.security.JwtUtil;
import com.healthdesk.security.MfaProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private MfaProvider mfaProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private OtpNotificationService otpNotificationService;

    @Transactional
    public LoginResponseDTO login(LoginRequestDTO loginRequest, String ipAddress) {
        Authentication authentication = authenticate(loginRequest);

        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = getUserFromAuthentication(authentication, loginRequest);

        if (user.isMfaEnabled() && (loginRequest.getOtpCode() == null || loginRequest.getOtpCode().isEmpty())) {
            String otp = mfaProvider.generateOtp(user.getId());
            otpNotificationService.sendOtp(user.getEmail(), otp, user.getUsername());
            auditLogService.logAction(user.getId(), "MFA_CHALLENGE", "OTP challenge created");
            return new LoginResponseDTO(null, null, "Bearer", user.getId(), user.getUsername(),
                    user.getEmail(), user.getFullName(), user.getRole().toString(), true);
        }

        if (user.isMfaEnabled() && !mfaProvider.validateOtp(user.getId(), loginRequest.getOtpCode())) {
            auditLogService.logAction(user.getId(), "MFA_FAILED", "Invalid OTP submitted");
            throw new RuntimeException("Invalid OTP");
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getUsername());
        String accessToken = jwtUtil.generateToken(userDetails);
        String refreshToken = generateRefreshToken(user);

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        auditLogService.logAction(user.getId(), "LOGIN", "User logged in from IP: " + ipAddress);

        return new LoginResponseDTO(accessToken, refreshToken, "Bearer", user.getId(),
                user.getUsername(), user.getEmail(), user.getFullName(), user.getRole().toString(), false);
    }

    private Authentication authenticate(LoginRequestDTO loginRequest) {
        return authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword())
        );
    }

    private User getUserFromAuthentication(Authentication authentication, LoginRequestDTO loginRequest) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            return user;
        }
        return userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private String generateRefreshToken(User user) {
        RefreshToken refreshToken = refreshTokenRepository.findByUser(user).orElseGet(RefreshToken::new);
        refreshToken.setUser(user);
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setExpiryDate(LocalDateTime.now().plusDays(7));
        refreshToken.setRevoked(false);

        refreshTokenRepository.save(refreshToken);
        return refreshToken.getToken();
    }
}
