package com.healthdesk.config;

import com.healthdesk.model.Role;
import com.healthdesk.model.User;
import com.healthdesk.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        upsertUser("admin", "admin@healthdesk.com", "System Administrator", Role.ADMIN, "admin123");
        upsertUser("doctor", "doctor@healthdesk.com", "Dr. John Smith", Role.DOCTOR, "doctor123");
        upsertUser("nurse", "nurse@healthdesk.com", "Jane Wilson", Role.NURSE, "nurse123");
        upsertUser("staff", "staff@healthdesk.com", "Mike Johnson", Role.STAFF, "staff123");
    }

    private void upsertUser(String username, String email, String fullName, Role role, String password) {
        User user = userRepository.findByUsername(username).orElseGet(User::new);
        user.setUsername(username);
        user.setEmail(email);
        user.setFullName(fullName);
        user.setRole(role);
        user.setPassword(passwordEncoder.encode(password));
        user.setActive(true);
        user.setMfaEnabled(false);
        userRepository.save(user);
    }
}
