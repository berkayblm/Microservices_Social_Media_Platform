package com.micro_project.userservice.service;

import com.micro_project.userservice.config.JwtUtil;
import com.micro_project.userservice.dto.AuthResponseDto;
import com.micro_project.userservice.dto.UserLoginDto;
import com.micro_project.userservice.dto.UserRegistrationDto;
import com.micro_project.userservice.entity.User;
import com.micro_project.userservice.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Value;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Value("${profile.service.url}")
    private String profileServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public AuthResponseDto registerUser(UserRegistrationDto registrationDto) {
        if (userRepository.existsByUsername(registrationDto.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        if (userRepository.existsByEmail(registrationDto.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setUsername(registrationDto.getUsername());
        user.setEmail(registrationDto.getEmail());
        user.setPassword(passwordEncoder.encode(registrationDto.getPassword()));

        User savedUser = userRepository.save(user);
        // Use the user ID in the token
        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getUsername());

        // Create empty profile in profile-service
        try {
            String url = profileServiceUrl + "/api/profiles";
            // Build profile payload
            java.util.Map<String, Object> profilePayload = new java.util.HashMap<>();
            profilePayload.put("userId", savedUser.getId());
            profilePayload.put("username", savedUser.getUsername());
            // Optionally set other fields (displayName, bio, etc.)
            restTemplate.postForEntity(url, profilePayload, Object.class);
        } catch (Exception e) {
            // Log but do not fail registration if profile creation fails
            System.err.println("Failed to create profile for user: " + savedUser.getId() + ", error: " + e.getMessage());
        }

        return new AuthResponseDto(token, savedUser.getUsername(), savedUser.getId());
    }

    public AuthResponseDto loginUser(UserLoginDto loginDto) {
        Optional<User> userOpt = userRepository.findByUsername(loginDto.getUsername());

        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        User user = userOpt.get();

        if (!passwordEncoder.matches(loginDto.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        // Use the user ID in the token
        String token = jwtUtil.generateToken(user.getId(), user.getUsername());
        return new AuthResponseDto(token, user.getUsername(), user.getId());

    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }
}
