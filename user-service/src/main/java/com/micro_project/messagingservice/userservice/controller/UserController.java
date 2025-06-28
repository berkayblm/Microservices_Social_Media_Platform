package com.micro_project.messagingservice.userservice.controller;

import com.micro_project.messagingservice.userservice.config.JwtUtil;
import com.micro_project.messagingservice.userservice.dto.UserDto;
import com.micro_project.messagingservice.userservice.entity.User;
import com.micro_project.messagingservice.userservice.service.UserService;
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

    @PostMapping("/validateToken")
    public ResponseEntity<UserDto> validateTokenAndGetUser(@RequestParam String token) {
        try {
            if (jwtUtil.isTokenExpired(token)) {
                return ResponseEntity.badRequest().build();
            }

            // Extract user information from token
            String username = jwtUtil.extractUsername(token);
            Long userId = jwtUtil.extractUserId(token);

            // Create and return UserDto
            UserDto userDto = new UserDto();
            userDto.setId(userId);
            userDto.setUsername(username);
            userDto.setToken(token);

            return ResponseEntity.ok(userDto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }


    @GetMapping("/token/user-id")
    public Long getUserIdFromToken(@RequestParam String token) {
        return jwtUtil.extractUserId(token);
    }

    @GetMapping("/random")
    public ResponseEntity<List<User>> getRandomUsers(@RequestParam(defaultValue = "8") int limit) {
        List<User> randomUsers = userService.getRandomUsers(limit);
        return ResponseEntity.ok(randomUsers);
    }

    @PostMapping("/random/exclude")
    public ResponseEntity<List<User>> getRandomUsersExcludingIds(
            @RequestBody List<Long> excludeIds,
            @RequestParam(defaultValue = "8") int limit) {
        List<User> randomUsers = userService.getRandomUsersExcludingIds(excludeIds, limit);
        return ResponseEntity.ok(randomUsers);
    }
}