package com.healthdesk.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

@Component
public class EncryptionUtil {

    @Value("${encryption.secret-key}")
    private String secretKey;

    private static final String KEY_ALGORITHM = "AES";
    private static final String LEGACY_ALGORITHM = "AES";
    private static final String GCM_ALGORITHM = "AES/GCM/NoPadding";
    private static final String GCM_PREFIX = "gcm:";
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private SecretKey getSecretKey() {
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        byte[] truncatedKey = new byte[32];
        System.arraycopy(keyBytes, 0, truncatedKey, 0, Math.min(keyBytes.length, 32));
        return new SecretKeySpec(truncatedKey, KEY_ALGORITHM);
    }

    public String encrypt(String data) throws Exception {
        if (data == null) return null;
        byte[] iv = new byte[GCM_IV_LENGTH];
        SECURE_RANDOM.nextBytes(iv);
        Cipher cipher = Cipher.getInstance(GCM_ALGORITHM);
        cipher.init(Cipher.ENCRYPT_MODE, getSecretKey(), new GCMParameterSpec(GCM_TAG_LENGTH, iv));
        byte[] encryptedBytes = cipher.doFinal(data.getBytes(StandardCharsets.UTF_8));
        byte[] payload = new byte[iv.length + encryptedBytes.length];
        System.arraycopy(iv, 0, payload, 0, iv.length);
        System.arraycopy(encryptedBytes, 0, payload, iv.length, encryptedBytes.length);
        return GCM_PREFIX + Base64.getEncoder().encodeToString(payload);
    }

    public String decrypt(String encryptedData) throws Exception {
        if (encryptedData == null) return null;
        if (encryptedData.startsWith(GCM_PREFIX)) {
            byte[] payload = Base64.getDecoder().decode(encryptedData.substring(GCM_PREFIX.length()));
            byte[] iv = Arrays.copyOfRange(payload, 0, GCM_IV_LENGTH);
            byte[] ciphertext = Arrays.copyOfRange(payload, GCM_IV_LENGTH, payload.length);
            Cipher cipher = Cipher.getInstance(GCM_ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, getSecretKey(), new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            return new String(cipher.doFinal(ciphertext), StandardCharsets.UTF_8);
        }

        Cipher cipher = Cipher.getInstance(LEGACY_ALGORITHM);
        cipher.init(Cipher.DECRYPT_MODE, getSecretKey());
        byte[] decryptedBytes = cipher.doFinal(Base64.getDecoder().decode(encryptedData));
        return new String(decryptedBytes, StandardCharsets.UTF_8);
    }
}
