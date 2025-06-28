package com.socialapp.profileservice.controller;

import com.socialapp.profileservice.client.FileUploadClient;
import com.socialapp.profileservice.dto.ImageUploadResponseDto;
import com.socialapp.profileservice.model.Profile;
import com.socialapp.profileservice.service.ProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.util.Optional;

@RestController
@RequestMapping("/api/profiles")
public class ProfileController {

    @Autowired
    private ProfileService profileService;

    @Autowired
    private FileUploadClient fileUploadClient;

    @GetMapping("/me")
    public ResponseEntity<Profile> getCurrentUserProfile(
            @RequestHeader(value = "userId") Long userId,
            @RequestHeader(value = "loggedInUser", required = false) String username) {
        Optional<Profile> profile = profileService.getProfileByUserId(userId);
        if (profile.isPresent()) {
            return ResponseEntity.ok(profile.get());
        } else {
            Profile defaultProfile = new Profile();
            defaultProfile.setUserId(userId);
            if (username != null) {
                defaultProfile.setUsername(username);
            }
            // Optionally set other default fields here
            return ResponseEntity.ok(defaultProfile);
        }
    }

    @PutMapping("/me")
    public ResponseEntity<Profile> updateCurrentUserProfile(
            @RequestHeader(value = "userId") Long userId,
            @RequestParam(value = "displayName", required = false) String displayName,
            @RequestParam(value = "bio", required = false) String bio,
            @RequestParam(value = "file", required = false) MultipartFile file) {
        
        // Get existing profile or create new one
        Optional<Profile> existingProfileOpt = profileService.getProfileByUserId(userId);
        Profile profile = existingProfileOpt.orElse(new Profile());
        profile.setUserId(userId);
        
        // Update fields if provided
        if (displayName != null) {
            profile.setDisplayName(displayName);
        }
        if (bio != null) {
            profile.setBio(bio);
        }
        
        // Upload image if provided
        if (file != null && !file.isEmpty()) {
            try {
                ResponseEntity<ImageUploadResponseDto> uploadResponse = fileUploadClient.uploadImage(file);
                if (uploadResponse.getStatusCode().is2xxSuccessful() && uploadResponse.getBody() != null) {
                    profile.setProfilePictureUrl(uploadResponse.getBody().getImageUrl());
                }
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
            }
        }
        
        Profile updatedProfile = profileService.updateProfile(userId, profile);
        return updatedProfile != null ? ResponseEntity.ok(updatedProfile) : ResponseEntity.notFound().build();
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<Profile> getProfileByUsername(@PathVariable String username) {
        Optional<Profile> profile = profileService.getProfileByUsername(username);
        return profile.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ProfileDto> getProfileByUserId(
            @PathVariable Long userId,
            @RequestHeader(value = "loggedInUserId", required = false) Long loggedInUserId) {
        Optional<Profile> profileOpt = profileService.getProfileByUserId(userId);
        if (profileOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Profile profile = profileOpt.get();
        ProfileDto dto = new ProfileDto();
        // Copy properties
        dto.setId(profile.getId());
        dto.setUserId(profile.getUserId());
        dto.setUsername(profile.getUsername());
        dto.setDisplayName(profile.getDisplayName());
        dto.setBio(profile.getBio());
        dto.setProfilePictureUrl(profile.getProfilePictureUrl());
        dto.setPostCount(profile.getPostCount());
        // Fetch follower/following counts from followers-service
        try {
            RestTemplate restTemplate = new RestTemplate();
            String countsUrl = "http://localhost:8084/api/follows/" + userId + "/counts";
            java.util.Map counts = restTemplate.getForObject(countsUrl, java.util.Map.class);
            if (counts != null) {
                Object followers = counts.get("followers");
                Object following = counts.get("following");
                dto.setFollowerCount(followers != null ? Long.valueOf(followers.toString()).intValue() : 0);
                dto.setFollowingCount(following != null ? Long.valueOf(following.toString()).intValue() : 0);
            }
        } catch (Exception e) {
            dto.setFollowerCount(0);
            dto.setFollowingCount(0);
        }
        // Default
        dto.setIsFollowing(false);
        // If loggedInUserId is present and not the same as userId, check follow status
        if (loggedInUserId != null && !loggedInUserId.equals(userId)) {
            try {
                RestTemplate restTemplate = new RestTemplate();
                String followersServiceUrl = "http://localhost:8084/api/follows/" + loggedInUserId + "/is-following/" + userId;
                Boolean isFollowing = restTemplate.getForObject(followersServiceUrl, Boolean.class);
                dto.setIsFollowing(Boolean.TRUE.equals(isFollowing));
            } catch (Exception e) {
                // Log and ignore
            }
        }
        return ResponseEntity.ok(dto);
    }

    @PostMapping
    public ResponseEntity<Profile> createProfile(@Valid @RequestBody Profile profile) {
        Profile createdProfile = profileService.createProfile(profile);
        return new ResponseEntity<>(createdProfile, HttpStatus.CREATED);
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteCurrentUserProfile(@RequestHeader(value = "userId") Long userId) {
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

class ProfileDto extends Profile {
    private boolean isFollowing;
    public boolean isIsFollowing() { return isFollowing; }
    public void setIsFollowing(boolean isFollowing) { this.isFollowing = isFollowing; }
} 