package com.healthdesk.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthFilter;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                // GUEST - Public access
                .requestMatchers(new AntPathRequestMatcher("/guest/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/assets/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/test.html")).permitAll()
                
                // APP - Static files
                .requestMatchers(new AntPathRequestMatcher("/app/css/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/app/js/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/app/images/**")).permitAll()
                
                // APP pages are static; role access is enforced via API authorization.
                .requestMatchers(new AntPathRequestMatcher("/app/**")).permitAll()
                
                // API Public endpoints
                .requestMatchers(new AntPathRequestMatcher("/api/public/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/auth/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/h2-console/**")).permitAll()
                .requestMatchers(new AntPathRequestMatcher("/api/hello")).permitAll()
                
                // API Private endpoints
                .requestMatchers(new AntPathRequestMatcher("/api/patients/**")).authenticated()
                .requestMatchers(new AntPathRequestMatcher("/api/appointments/**")).authenticated()
                .requestMatchers(new AntPathRequestMatcher("/api/users/**")).hasRole("ADMIN")
                .requestMatchers(new AntPathRequestMatcher("/api/reports/**")).hasAnyRole("ADMIN", "DOCTOR")
                
                .anyRequest().authenticated()
            )
            .headers(headers -> headers.frameOptions(frame -> frame.disable()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
