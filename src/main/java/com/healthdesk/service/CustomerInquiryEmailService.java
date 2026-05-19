package com.healthdesk.service;

import com.healthdesk.model.CustomerInquiry;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class CustomerInquiryEmailService {
    private static final Logger log = LoggerFactory.getLogger(CustomerInquiryEmailService.class);

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromAddress;

    public CustomerInquiryEmailService(
            @org.springframework.beans.factory.annotation.Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public boolean sendReply(CustomerInquiry inquiry) {
        if (inquiry == null || !hasText(inquiry.getEmail()) || !inquiry.getEmail().contains("@")) {
            log.info("Inquiry reply email skipped because recipient email is missing or invalid.");
            return false;
        }
        if (mailSender == null || !hasText(fromAddress)) {
            log.info("Inquiry reply email skipped because SMTP mail sender is not configured.");
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setTo(inquiry.getEmail());
            helper.setFrom(fromAddress);
            helper.setSubject("Re: " + safeSubject(inquiry.getSubject()));
            helper.setText(buildReplyEmailHtml(inquiry), true);
            mailSender.send(message);
            log.info("Inquiry reply email sent to {}", maskEmail(inquiry.getEmail()));
            return true;
        } catch (Exception ex) {
            log.warn("Inquiry reply email failed for {}: {}", maskEmail(inquiry.getEmail()), ex.getMessage());
            return false;
        }
    }

    private String buildReplyEmailHtml(CustomerInquiry inquiry) {
        String safeName = escapeHtml(resolveName(inquiry.getName()));
        String safeReply = escapeHtml(inquiry.getReplyMessage()).replace("\n", "<br>");
        String safeOriginal = escapeHtml(inquiry.getMessage()).replace("\n", "<br>");
        String safeAdmin = escapeHtml(resolveName(inquiry.getRepliedBy()));

        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>HealthDesk Inquiry Reply</title>
                </head>
                <body style="margin:0;padding:24px;background:#f0fdfa;font-family:Arial,sans-serif;color:#0f172a;">
                    <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #ccfbf1;border-radius:16px;overflow:hidden;">
                        <div style="background:#0f766e;padding:22px 26px;color:#ffffff;">
                            <h1 style="margin:0;font-size:24px;">HealthDesk</h1>
                            <p style="margin:6px 0 0;color:#ccfbf1;">Response to your inquiry</p>
                        </div>
                        <div style="padding:26px;">
                            <p style="margin-top:0;">Hello <strong>%s</strong>,</p>
                            <p>Thank you for contacting HealthDesk Clinic. Here is our response:</p>
                            <div style="margin:18px 0;padding:16px;border-left:4px solid #0f766e;background:#f8fafc;border-radius:10px;">
                                %s
                            </div>
                            <p style="margin-bottom:8px;color:#475569;"><strong>Your original message:</strong></p>
                            <div style="padding:12px;background:#f1f5f9;border-radius:10px;color:#475569;font-size:14px;">
                                %s
                            </div>
                            <p style="margin:24px 0 0;">Best regards,<br><strong>%s</strong><br>HealthDesk Clinic</p>
                        </div>
                        <div style="padding:18px 26px;background:#f8fafc;border-top:1px solid #ccfbf1;color:#64748b;font-size:12px;">
                            <p style="margin:0 0 6px;">Cawayan, Catarman, Northern Samar</p>
                            <p style="margin:0;">09486729942 | healthdesk.info1@gmail.com</p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(safeName, safeReply, safeOriginal, safeAdmin);
    }

    private String safeSubject(String subject) {
        return hasText(subject) ? subject : "HealthDesk Inquiry";
    }

    private String resolveName(String name) {
        return hasText(name) ? name : "Guest";
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
