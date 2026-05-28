package com.healthdesk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
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

        normalizeRailwayMysqlUrl();
        application.run(args);
    }

    private static void normalizeRailwayMysqlUrl() {
        String datasourceUrl = System.getenv("SPRING_DATASOURCE_URL");
        if (datasourceUrl == null || !datasourceUrl.startsWith("mysql://")) {
            return;
        }

        URI uri = URI.create(datasourceUrl);
        String query = uri.getRawQuery();
        String jdbcUrl = "jdbc:mysql://" + uri.getHost() + ":" + uri.getPort() + uri.getPath()
                + (query == null || query.isBlank()
                ? "?useSSL=true&sslMode=REQUIRED&allowPublicKeyRetrieval=true&serverTimezone=UTC"
                : "?" + query);
        System.setProperty("spring.datasource.url", jdbcUrl);

        String userInfo = uri.getUserInfo();
        if (userInfo != null && !userInfo.isBlank()) {
            String[] credentials = userInfo.split(":", 2);
            System.setProperty("spring.datasource.username",
                    URLDecoder.decode(credentials[0], StandardCharsets.UTF_8));
            if (credentials.length > 1) {
                System.setProperty("spring.datasource.password",
                        URLDecoder.decode(credentials[1], StandardCharsets.UTF_8));
            }
        }
    }
}   
