package com.micro_project.userservice.controller;

import com.micro_project.userservice.config.JwtUtil;
import com.micro_project.userservice.entity.User;
import com.micro_project.userservice.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;
    @Autowired
    private JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        Optional<User> user = userService.getUserById(id);
        return user.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<User> getUserByUsername(@PathVariable String username) {
        Optional<User> user = userService.getUserByUsername(username);
        return user.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/validate-token")
    public Boolean validateToken(@RequestParam String token) {
        try {
            // Basic validation that the token is not expired
            return !jwtUtil.isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    @GetMapping("/token/user-id")
    public Long getUserIdFromToken(@RequestParam String token) {
        return jwtUtil.extractUserId(token);
    }


}