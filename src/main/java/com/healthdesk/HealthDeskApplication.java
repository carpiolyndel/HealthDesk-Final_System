package com.healthdesk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import java.util.TimeZone;

@SpringBootApplication(scanBasePackages = "com.healthdesk")
@EnableJpaRepositories(basePackages = "com.healthdesk.repository")
@EntityScan(basePackages = "com.healthdesk.model")
@EnableTransactionManagement
public class HealthDeskApplication {
    public static void main(String[] args) {
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Manila"));
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
