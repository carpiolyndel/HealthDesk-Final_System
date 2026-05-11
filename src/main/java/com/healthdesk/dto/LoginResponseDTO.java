package com.healthdesk.dto;

public class LoginResponseDTO {
    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private String userId;
    private String username;
    private String role;
    private boolean mfaRequired;

    // Constructors
    public LoginResponseDTO() {}

    public LoginResponseDTO(String accessToken, String refreshToken, String tokenType,
                            String userId, String username, String role, boolean mfaRequired) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenType = tokenType;
        this.userId = userId;
        this.username = username;
        this.role = role;
        this.mfaRequired = mfaRequired;
    }

    // Getters
    public String getAccessToken() { return accessToken; }
    public String getRefreshToken() { return refreshToken; }
    public String getTokenType() { return tokenType; }
    public String getUserId() { return userId; }
    public String getUsername() { return username; }
    public String getRole() { return role; }
    public boolean isMfaRequired() { return mfaRequired; }

    // Setters
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }
    public void setUserId(String userId) { this.userId = userId; }
    public void setUsername(String username) { this.username = username; }
    public void setRole(String role) { this.role = role; }
    public void setMfaRequired(boolean mfaRequired) { this.mfaRequired = mfaRequired; }
}