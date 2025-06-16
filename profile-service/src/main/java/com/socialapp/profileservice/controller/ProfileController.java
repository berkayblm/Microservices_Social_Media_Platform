package com.socialapp.profileservice.controller;

import com.socialapp.profileservice.model.Profile;
import com.socialapp.profileservice.service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Optional;

@RestController
@RequestMapping("/profiles")
public class ProfileController {

    @Autowired
    private ProfileService profileService;

    @GetMapping("/{userId}")
    public ResponseEntity<Profile> getProfileByUserId(@PathVariable Long userId) {
        Optional<Profile> profile = profileService.getProfileByUserId(userId);
        return profile.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<Profile> getProfileByUsername(@PathVariable String username) {
        Optional<Profile> profile = profileService.getProfileByUsername(username);
        return profile.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Profile> createProfile(@Valid @RequestBody Profile profile) {
        Profile createdProfile = profileService.createProfile(profile);
        return new ResponseEntity<>(createdProfile, HttpStatus.CREATED);
    }

    @PutMapping("/{userId}")
    public ResponseEntity<Profile> updateProfile(@PathVariable Long userId, @Valid @RequestBody Profile profile) {
        Profile updatedProfile = profileService.updateProfile(userId, profile);
        return updatedProfile != null ? ResponseEntity.ok(updatedProfile) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteProfile(@PathVariable Long userId) {
        profileService.deleteProfile(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{userId}/incrementPostCount")
    public ResponseEntity<Void> incrementPostCount(@PathVariable Long userId) {
        profileService.incrementPostCount(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{userId}/decrementPostCount")
    public ResponseEntity<Void> decrementPostCount(@PathVariable Long userId) {
        profileService.decrementPostCount(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{userId}/incrementFollowerCount")
    public ResponseEntity<Void> incrementFollowerCount(@PathVariable Long userId) {
        profileService.incrementFollowerCount(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{userId}/decrementFollowerCount")
    public ResponseEntity<Void> decrementFollowerCount(@PathVariable Long userId) {
        profileService.decrementFollowerCount(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{userId}/incrementFollowingCount")
    public ResponseEntity<Void> incrementFollowingCount(@PathVariable Long userId) {
        profileService.incrementFollowingCount(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{userId}/decrementFollowingCount")
    public ResponseEntity<Void> decrementFollowingCount(@PathVariable Long userId) {
        profileService.decrementFollowingCount(userId);
        return ResponseEntity.noContent().build();
    }
} 