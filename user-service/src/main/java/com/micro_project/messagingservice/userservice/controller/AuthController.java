package com.micro_project.messagingservice.userservice.controller;

import com.micro_project.messagingservice.userservice.dto.AuthResponseDto;
import com.micro_project.messagingservice.userservice.dto.UserLoginDto;
import com.micro_project.messagingservice.userservice.dto.UserRegistrationDto;
import com.micro_project.messagingservice.userservice.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDto> register(@RequestBody UserRegistrationDto registrationDto) {
        try {
            AuthResponseDto response = userService.registerUser(registrationDto);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new AuthResponseDto(null, null, null));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@RequestBody UserLoginDto loginDto) {
        try {
            AuthResponseDto response = userService.loginUser(loginDto);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new AuthResponseDto(null, null, null));
        }
    }
}