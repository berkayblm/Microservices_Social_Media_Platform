package com.micro_project.messagingservice.userservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // Disable CSRF protection
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/users/validateToken").permitAll()
                        .requestMatchers("/api/users/token/user-id").permitAll()
                        .requestMatchers("/api/users").permitAll() // Allow getting all users for recommendations
                        .requestMatchers("/api/users/{id}").permitAll() // Allow internal service calls
                        .requestMatchers("/api/users/username/{username}").permitAll() // Allow internal service calls
                        .requestMatchers("/api/users/random").permitAll() // Allow getting random users
                        .requestMatchers("/api/users/random/exclude").permitAll() // Allow getting random users excluding specific IDs
                        .requestMatchers("/api/users/**").authenticated()
                        .anyRequest().authenticated()
                );
        return http.build();
    }
}
