package com.healthdesk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication
@EnableTransactionManagement
public class HealthDeskApplication {
    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(HealthDeskApplication.class);

        String activeProfile = System.getenv("SPRING_PROFILES_ACTIVE");
        if (activeProfile == null || activeProfile.isBlank()) {
            String mysqlHost = System.getenv("MYSQLHOST");
            if (mysqlHost != null && !mysqlHost.isBlank()) {
                application.setAdditionalProfiles("railway");
            }
        }

        application.run(args);
    }
}   