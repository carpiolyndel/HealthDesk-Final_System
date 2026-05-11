package com.healthdesk.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class OtpNotificationService {
    private static final Logger log = LoggerFactory.getLogger(OtpNotificationService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromAddress;

    @Value("${mfa.delivery.mode:console}")
    private String deliveryMode;

    public OtpNotificationService(@org.springframework.beans.factory.annotation.Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOtp(String toEmail, String otp) {
        if ("console".equalsIgnoreCase(deliveryMode)) {
            log.info("DEV OTP for {} is {}", maskEmail(toEmail), otp);
            return;
        }

        if (mailSender == null) {
            log.info("OTP email sender is not configured. DEV OTP for {} is {}", maskEmail(toEmail), otp);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setFrom(fromAddress);
            message.setSubject("HealthDesk Verification Code");
            message.setText("Your verification code is: " + otp + ". It expires in 5 minutes.");
            mailSender.send(message);
        } catch (Exception ex) {
            log.warn("OTP email dispatch failed for {}: {}", maskEmail(toEmail), ex.getMessage());
            throw new IllegalStateException("Unable to send OTP at this time. Please try again.");
        }
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "unknown";
        String[] parts = email.split("@", 2);
        String name = parts[0];
        String safe = name.length() <= 2 ? "***" : name.substring(0, 2) + "***";
        return safe + "@" + parts[1];
    }
}
