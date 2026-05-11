package com.healthdesk.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import java.security.SecureRandom;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class MfaProvider {

    @Value("${mfa.otp.length}")
    private int otpLength;

    @Value("${mfa.otp.expiration}")
    private long otpExpiration;

    @Value("${mfa.otp.max-attempts:5}")
    private int maxAttempts;

    private final Map<String, OtpData> otpStore = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();

    public String generateOtp(String userId) {
        String otp = generateRandomOtp();
        otpStore.put(userId, new OtpData(hashOtp(otp), LocalDateTime.now().plusNanos(otpExpiration * 1_000_000)));
        return otp;
    }

    public boolean validateOtp(String userId, String otp) {
        OtpData otpData = otpStore.get(userId);
        if (otpData == null) return false;
        if (otpData.expiry.isBefore(LocalDateTime.now())) {
            otpStore.remove(userId);
            return false;
        }

        otpData.attempts++;
        if (otpData.attempts > maxAttempts) {
            otpStore.remove(userId);
            return false;
        }

        if (otpData.hashedOtp.equals(hashOtp(otp))) {
            otpStore.remove(userId);
            return true;
        }
        return false;
    }

    public void clearOtp(String userId) {
        otpStore.remove(userId);
    }

    private String generateRandomOtp() {
        StringBuilder otp = new StringBuilder();
        for (int i = 0; i < otpLength; i++) {
            otp.append(secureRandom.nextInt(10));
        }
        return otp.toString();
    }

    private String hashOtp(String otp) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(otp.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder();
            for (byte b : bytes) builder.append(String.format("%02x", b));
            return builder.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Unable to hash OTP", e);
        }
    }

    private static class OtpData {
        String hashedOtp;
        LocalDateTime expiry;
        int attempts;

        OtpData(String hashedOtp, LocalDateTime expiry) {
            this.hashedOtp = hashedOtp;
            this.expiry = expiry;
            this.attempts = 0;
        }
    }
}
