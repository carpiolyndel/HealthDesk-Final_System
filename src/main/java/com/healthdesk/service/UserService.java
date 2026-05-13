package com.healthdesk.service;

import com.healthdesk.dto.UserDTO;
import com.healthdesk.model.Role;
import com.healthdesk.model.User;
import com.healthdesk.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuditLogService auditLogService;

    public List<UserDTO> getUsers(String search) {
        return userRepository.findAll().stream()
                .filter(User::isActive)
                .filter(user -> search == null || search.isBlank() || matchesSearch(user, search))
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public UserDTO getUser(String id) {
        return userRepository.findById(id).map(this::toDTO).orElse(null);
    }

    public UserDTO createUser(UserDTO dto, User actor) {
        validateUserInput(dto, true);

        if (userRepository.existsByUsername(dto.getUsername())) {
            throw new IllegalArgumentException("Username already exists.");
        }
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Email address already exists.");
        }

        User user = new User();
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        user.setFullName(dto.getFullName());
        user.setPhoneNumber(dto.getPhoneNumber());
        Role role = parseRole(dto.getRole());
        applyCredentials(user, dto, role);
        user.setRole(role);
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setActive(true);
        user.setMfaEnabled(true);

        User saved = userRepository.save(user);
        auditLogService.logAction(actor.getId(), "CREATE_USER", "Created user: " + saved.getUsername());
        return toDTO(saved);
    }

    public UserDTO updateUser(String id, UserDTO dto, User actor) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));

        if (!existing.getUsername().equals(dto.getUsername()) && userRepository.existsByUsername(dto.getUsername())) {
            throw new IllegalArgumentException("Username already exists.");
        }
        if (!existing.getEmail().equals(dto.getEmail()) && userRepository.existsByEmail(dto.getEmail())) {
            throw new IllegalArgumentException("Email address already exists.");
        }

        existing.setUsername(dto.getUsername());
        existing.setEmail(dto.getEmail());
        existing.setFullName(dto.getFullName());
        existing.setPhoneNumber(dto.getPhoneNumber());
        Role role = parseRole(dto.getRole());
        applyCredentials(existing, dto, role);
        existing.setRole(role);

        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            existing.setPassword(passwordEncoder.encode(dto.getPassword()));
        }

        User saved = userRepository.save(existing);
        auditLogService.logAction(actor.getId(), "UPDATE_USER", "Updated user: " + saved.getUsername());
        return toDTO(saved);
    }

    public void deleteUser(String id, User actor) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        userRepository.delete(existing);
        auditLogService.logAction(actor.getId(), "DELETE_USER", "Deleted user: " + existing.getUsername());
    }

    public UserDTO resetPassword(String id, String newPassword, User actor) {
        if (newPassword == null || newPassword.isBlank()) {
            throw new IllegalArgumentException("Password is required.");
        }
        if (newPassword.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters.");
        }

        User existing = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        existing.setPassword(passwordEncoder.encode(newPassword));
        User saved = userRepository.save(existing);
        auditLogService.logAction(actor.getId(), "RESET_USER_PASSWORD", "Reset password for user: " + saved.getUsername());
        return toDTO(saved);
    }

    public UserDTO archiveUser(String id, User actor) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        existing.setActive(false);
        User saved = userRepository.save(existing);
        auditLogService.logAction(actor.getId(), "ARCHIVE_USER", "Archived user: " + saved.getUsername());
        return toDTO(saved);
    }

    private boolean matchesSearch(User user, String search) {
        String lower = search.toLowerCase();
        return user.getUsername().toLowerCase().contains(lower)
                || user.getFullName().toLowerCase().contains(lower)
                || user.getEmail().toLowerCase().contains(lower)
                || containsIgnoreCase(user.getLicenseNumber(), lower)
                || containsIgnoreCase(user.getEmployeeId(), lower);
    }

    private boolean containsIgnoreCase(String value, String lowerSearch) {
        return value != null && value.toLowerCase().contains(lowerSearch);
    }

    private Role parseRole(String roleName) {
        if (roleName == null || roleName.isBlank()) {
            return Role.STAFF;
        }
        try {
            return Role.valueOf(roleName.toUpperCase());
        } catch (IllegalArgumentException e) {
            return Role.STAFF;
        }
    }

    private void validateUserInput(UserDTO dto, boolean requirePassword) {
        if (dto.getUsername() == null || dto.getUsername().isBlank()) {
            throw new IllegalArgumentException("Username is required.");
        }
        if (dto.getEmail() == null || dto.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required.");
        }
        if (dto.getFullName() == null || dto.getFullName().isBlank()) {
            throw new IllegalArgumentException("Full name is required.");
        }
        if (requirePassword && (dto.getPassword() == null || dto.getPassword().isBlank())) {
            throw new IllegalArgumentException("Password is required.");
        }
    }

    private void applyCredentials(User user, UserDTO dto, Role role) {
        String licenseNumber = normalizeBlank(dto.getLicenseNumber());
        String employeeId = normalizeBlank(dto.getEmployeeId());

        if (role == Role.DOCTOR || role == Role.NURSE) {
            if (licenseNumber == null) {
                throw new IllegalArgumentException("Professional license number is required for doctors and nurses.");
            }
            user.setLicenseNumber(licenseNumber);
            user.setEmployeeId(null);
            return;
        }

        if (role == Role.STAFF) {
            if (employeeId == null) {
                throw new IllegalArgumentException("Employee ID is required for staff users.");
            }
            user.setEmployeeId(employeeId);
            user.setLicenseNumber(null);
            return;
        }

        user.setLicenseNumber(licenseNumber);
        user.setEmployeeId(employeeId);
    }

    private String normalizeBlank(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private UserDTO toDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setLicenseNumber(user.getLicenseNumber());
        dto.setEmployeeId(user.getEmployeeId());
        dto.setRole(user.getRole() != null ? user.getRole().name() : Role.STAFF.name());
        return dto;
    }
}
