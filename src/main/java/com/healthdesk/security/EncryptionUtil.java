package com.healthdesk.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Component
public class EncryptionUtil {

    @Value("${encryption.secret-key}")
    private String secretKey;

    private static final String ALGORITHM = "AES";

    private SecretKey getSecretKey() {
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        byte[] truncatedKey = new byte[32];
        System.arraycopy(keyBytes, 0, truncatedKey, 0, Math.min(keyBytes.length, 32));
        return new SecretKeySpec(truncatedKey, ALGORITHM);
    }

    public String encrypt(String data) throws Exception {
        if (data == null) return null;
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.ENCRYPT_MODE, getSecretKey());
        byte[] encryptedBytes = cipher.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(encryptedBytes);
    }

    public String decrypt(String encryptedData) throws Exception {
        if (encryptedData == null) return null;
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.DECRYPT_MODE, getSecretKey());
        byte[] decryptedBytes = cipher.doFinal(Base64.getDecoder().decode(encryptedData));
        return new String(decryptedBytes, StandardCharsets.UTF_8);
    }
}