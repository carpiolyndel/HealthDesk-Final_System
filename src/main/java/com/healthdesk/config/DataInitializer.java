package com.healthdesk.config;

import com.healthdesk.model.Role;
import com.healthdesk.model.User;
import com.healthdesk.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${healthdesk.initial-admin.username:admin}")
    private String adminUsername;

    @Value("${healthdesk.initial-admin.email:}")
    private String adminEmail;

    @Value("${healthdesk.initial-admin.full-name:System Administrator}")
    private String adminFullName;

    @Value("${healthdesk.initial-admin.password:}")
    private String adminPassword;

    @Value("${healthdesk.demo-users.enabled:false}")
    private boolean demoUsersEnabled;

    @Value("${healthdesk.demo.doctor.password:}")
    private String doctorPassword;

    @Value("${healthdesk.demo.doctor.email:doctor@healthdesk.local}")
    private String doctorEmail;

    @Value("${healthdesk.demo.nurse.password:}")
    private String nursePassword;

    @Value("${healthdesk.demo.nurse.email:nurse@healthdesk.local}")
    private String nurseEmail;

    @Value("${healthdesk.demo.staff.password:}")
    private String staffPassword;

    @Value("${healthdesk.demo.staff.email:staff@healthdesk.local}")
    private String staffEmail;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (hasText(adminPassword)) {
            String email = hasText(adminEmail) ? adminEmail : adminUsername + "@healthdesk.local";
            upsertUser(adminUsername, email, adminFullName, Role.ADMIN, adminPassword, false);
        }

        if (demoUsersEnabled) {
            upsertDemoUser("doctor", doctorEmail, "Demo Doctor", Role.DOCTOR, doctorPassword);
            upsertDemoUser("nurse", nurseEmail, "Demo Nurse", Role.NURSE, nursePassword);
            upsertDemoUser("staff", staffEmail, "Demo Staff", Role.STAFF, staffPassword);
        }
    }

    private void upsertUser(String username, String email, String fullName, Role role, String password, boolean mfaEnabled) {
        User user = userRepository.findByUsername(username).orElseGet(User::new);
        user.setUsername(username);
        user.setEmail(email);
        user.setFullName(fullName);
        user.setRole(role);
        user.setPassword(passwordEncoder.encode(password));
        user.setActive(true);
        user.setMfaEnabled(mfaEnabled);
        userRepository.save(user);
    }

    private void upsertDemoUser(String username, String email, String fullName, Role role, String password) {
        if (hasText(password)) {
            upsertUser(username, email, fullName, role, password, true);
        }
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
