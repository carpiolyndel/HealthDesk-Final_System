package com.healthdesk.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class OtpNotificationService {
    private static final Logger log = LoggerFactory.getLogger(OtpNotificationService.class);

    private final JavaMailSender mailSender;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    @Value("${spring.mail.username:}")
    private String fromAddress;

    @Value("${mfa.delivery.mode:email}")
    private String deliveryMode;

    @Value("${emailjs.service-id:}")
    private String emailJsServiceId;

    @Value("${emailjs.template-id:}")
    private String emailJsTemplateId;

    @Value("${emailjs.public-key:}")
    private String emailJsPublicKey;

    @Value("${emailjs.private-key:}")
    private String emailJsPrivateKey;

    public OtpNotificationService(
            @org.springframework.beans.factory.annotation.Autowired(required = false) JavaMailSender mailSender,
            ObjectMapper objectMapper) {
        this.mailSender = mailSender;
        this.objectMapper = objectMapper;
    }

    public void sendOtp(String toEmail, String otp) {
        sendOtp(toEmail, otp, null);
    }

    public void sendOtp(String toEmail, String otp, String recipientName) {
        if ("console".equalsIgnoreCase(deliveryMode)) {
            log.info("DEV OTP for {} is {}", maskEmail(toEmail), otp);
            return;
        }

        if ("emailjs".equalsIgnoreCase(deliveryMode) || isEmailJsConfigured()) {
            sendOtpWithEmailJs(toEmail, otp, recipientName);
            return;
        }

        if (mailSender == null) {
            log.info("OTP email sender is not configured. OTP for {} is {}", maskEmail(toEmail), otp);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setTo(toEmail);
            helper.setFrom(fromAddress);
            helper.setSubject("HealthDesk | Your One-Time Password (OTP)");
            helper.setText(buildOtpEmailHtml(recipientName, toEmail, otp), true);
            mailSender.send(message);
            log.info("OTP email sent to {}", maskEmail(toEmail));
        } catch (Exception ex) {
            log.warn("OTP email dispatch failed for {}: {}. OTP for this login is {}", maskEmail(toEmail), ex.getMessage(), otp);
        }
    }

    private void sendOtpWithEmailJs(String toEmail, String otp, String recipientName) {
        if (!isEmailJsConfigured()) {
            log.warn("EmailJS delivery is selected but service/template/public key is missing. OTP for {} is {}", maskEmail(toEmail), otp);
            return;
        }

        try {
            Map<String, Object> templateParams = new LinkedHashMap<>();
            String displayName = resolveDisplayName(recipientName, toEmail);
            templateParams.put("to_email", toEmail);
            templateParams.put("user_email", toEmail);
            templateParams.put("email", toEmail);
            templateParams.put("recipient_email", toEmail);
            templateParams.put("name", displayName);
            templateParams.put("user_name", displayName);
            templateParams.put("username", displayName);
            templateParams.put("otp", otp);
            templateParams.put("otp_code", otp);
            templateParams.put("code", otp);
            templateParams.put("app_name", "HealthDesk");

            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("service_id", emailJsServiceId);
            payload.put("template_id", emailJsTemplateId);
            payload.put("user_id", emailJsPublicKey);
            payload.put("template_params", templateParams);
            if (hasText(emailJsPrivateKey)) {
                payload.put("accessToken", emailJsPrivateKey);
            }

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.emailjs.com/api/v1.0/email/send"))
                    .timeout(Duration.ofSeconds(10))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("EmailJS OTP email sent to {}", maskEmail(toEmail));
            } else {
                log.warn("EmailJS OTP email failed for {} with status {}: {}. OTP for this login is {}",
                        maskEmail(toEmail), response.statusCode(), response.body(), otp);
            }
        } catch (Exception ex) {
            log.warn("EmailJS OTP email dispatch failed for {}: {}. OTP for this login is {}", maskEmail(toEmail), ex.getMessage(), otp);
        }
    }

    private boolean isEmailJsConfigured() {
        return hasText(emailJsServiceId) && hasText(emailJsTemplateId) && hasText(emailJsPublicKey);
    }

    private String buildOtpEmailHtml(String recipientName, String toEmail, String otp) {
        String safeName = escapeHtml(resolveDisplayName(recipientName, toEmail));
        String safeOtp = escapeHtml(otp);
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>HealthDesk | Your One-Time Password (OTP)</title>
                    <style>
                        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #e6f7f5; margin: 0; padding: 20px; }
                        .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #d1fae5; }
                        .header { background: linear-gradient(135deg, #0f766e, #0d9488); padding: 30px 20px; text-align: center; }
                        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
                        .header span { color: #a7f3d0; }
                        .header p { color: #ccfbf1; margin: 8px 0 0; font-size: 13px; }
                        .content { padding: 35px 30px; text-align: center; }
                        .greeting { font-size: 16px; color: #0f172a; margin-bottom: 20px; font-weight: 500; }
                        .otp-label { color: #0f766e; font-size: 14px; letter-spacing: 2px; margin-bottom: 15px; text-transform: uppercase; font-weight: 600; }
                        .otp-code { background: #f0fdfa; padding: 25px; font-size: 48px; font-weight: 800; letter-spacing: 12px; color: #0d9488; font-family: monospace; border-radius: 16px; margin: 20px 0; border: 1px solid #ccfbf1; }
                        .expiry-text { color: #64748b; font-size: 13px; margin: 15px 0; }
                        .warning-text { color: #ef4444; font-size: 12px; margin: 20px 0 10px; background: #fef2f2; padding: 10px; border-radius: 8px; }
                        .footer { background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #dcfce7; }
                        .footer p { margin: 6px 0; font-size: 11px; color: #94a3b8; }
                        .footer .contact { color: #0d9488; font-weight: 500; }
                        .auto-message { font-size: 10px; color: #94a3b8; margin-top: 12px; }
                        @media (max-width: 480px) {
                            .otp-code { font-size: 32px; letter-spacing: 6px; padding: 18px; }
                            .content { padding: 25px 20px; }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Health<span>Desk</span></h1>
                            <p>Clinic Patient Record & Appointment System</p>
                        </div>
                        <div class="content">
                            <div class="greeting">Hello <strong>%s</strong>!</div>
                            <div class="otp-label">YOUR ONE-TIME PASSWORD (OTP)</div>
                            <div class="otp-code">%s</div>
                            <div class="expiry-text">This OTP expires in <strong>5 minutes</strong></div>
                            <div class="warning-text">For your security, do not share this OTP with anyone</div>
                            <div style="margin-top: 20px; font-size: 13px; color: #475569;">Use the OTP code above to continue your login or verification process.</div>
                        </div>
                        <div class="footer">
                            <p>If you have any questions or need assistance, feel free to contact us at</p>
                            <p class="contact"><strong>HealthDesk Clinic Helpdesk</strong></p>
                            <p>+63 948 672 9942 | healthdesk.info1@gmail.com</p>
                            <p>Cawayan, Catarman, Northern Samar</p>
                            <div class="auto-message">This is an auto-generated email. Please do not reply to this message.</div>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(safeName, safeOtp);
    }

    private String resolveDisplayName(String recipientName, String email) {
        if (recipientName != null && !recipientName.isBlank()) return recipientName;
        if (email == null || email.isBlank()) return "HealthDesk User";
        int at = email.indexOf('@');
        String name = at > 0 ? email.substring(0, at) : email;
        return name.isBlank() ? "HealthDesk User" : name;
    }

    private String escapeHtml(String value) {
        if (value == null) return "";
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return "unknown";
        String[] parts = email.split("@", 2);
        String name = parts[0];
        String safe = name.length() <= 2 ? "***" : name.substring(0, 2) + "***";
        return safe + "@" + parts[1];
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
