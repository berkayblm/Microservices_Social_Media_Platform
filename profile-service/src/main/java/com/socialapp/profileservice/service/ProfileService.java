package com.socialapp.profileservice.service;

import com.socialapp.profileservice.model.Profile;
import com.socialapp.profileservice.repository.ProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;
import com.socialapp.profileservice.dto.ProfileDto;

@Service
public class ProfileService {

    @Autowired
    private ProfileRepository profileRepository;
    
    @Autowired
    private RestTemplate restTemplate;

    public Optional<Profile> getProfileByUserId(Long userId) {
        return profileRepository.findByUserId(userId);
    }

    public Optional<Profile> getProfileByUsername(String username) {
        return profileRepository.findByUsername(username);
    }
    
    /**
     * Get profile with follower/following counts fetched from followers service
     */
    public Profile getProfileWithFollowCounts(Long userId) {
        Optional<Profile> profileOpt = profileRepository.findByUserId(userId);
        Profile profile;
        
        if (profileOpt.isPresent()) {
            profile = profileOpt.get();
        } else {
            // Create a default profile if none exists
            profile = new Profile();
            profile.setUserId(userId);
        }
        
        // Fetch follower/following counts from followers-service
        try {
            String countsUrl = "http://localhost:8084/api/follows/" + userId + "/counts";
            System.out.println("Fetching counts from: " + countsUrl);
            java.util.Map counts = restTemplate.getForObject(countsUrl, java.util.Map.class);
            if (counts != null) {
                Object followers = counts.get("followers");
                Object following = counts.get("following");
                System.out.println("Followers count: " + followers + ", Following count: " + following);
                profile.setFollowerCount(followers != null ? Long.valueOf(followers.toString()).intValue() : 0);
                profile.setFollowingCount(following != null ? Long.valueOf(following.toString()).intValue() : 0);
            }
        } catch (Exception e) {
            System.err.println("Error fetching follow counts: " + e.getMessage());
            e.printStackTrace();
            profile.setFollowerCount(0);
            profile.setFollowingCount(0);
        }
        
                return profile;
    }
    
    /**
     * Get profile DTO with follower/following counts and follow status
     */
    public ProfileDto getProfileDtoWithFollowCounts(Long userId, Long loggedInUserId) {
        Optional<Profile> profileOpt = profileRepository.findByUserId(userId);
        if (profileOpt.isEmpty()) {
            return null;
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
            String countsUrl = "http://localhost:8084/api/follows/" + userId + "/counts";
            System.out.println("Fetching counts for user " + userId + " from: " + countsUrl);
            java.util.Map counts = restTemplate.getForObject(countsUrl, java.util.Map.class);
            if (counts != null) {
                Object followers = counts.get("followers");
                Object following = counts.get("following");
                System.out.println("User " + userId + " - Followers count: " + followers + ", Following count: " + following);
                dto.setFollowerCount(followers != null ? Long.valueOf(followers.toString()).intValue() : 0);
                dto.setFollowingCount(following != null ? Long.valueOf(following.toString()).intValue() : 0);
            }
        } catch (Exception e) {
            System.err.println("Error fetching follow counts for user " + userId + ": " + e.getMessage());
            e.printStackTrace();
            dto.setFollowerCount(0);
            dto.setFollowingCount(0);
        }
        
        // Default follow status
        dto.setIsFollowing(false);
        
        // If loggedInUserId is present and not the same as userId, check follow status
        if (loggedInUserId != null && !loggedInUserId.equals(userId)) {
            try {
                String followersServiceUrl = "http://localhost:8084/api/follows/" + loggedInUserId + "/is-following/" + userId;
                Boolean isFollowing = restTemplate.getForObject(followersServiceUrl, Boolean.class);
                dto.setIsFollowing(Boolean.TRUE.equals(isFollowing));
            } catch (Exception e) {
                System.err.println("Error checking follow status: " + e.getMessage());
                // Log and ignore
            }
        }
        
        return dto;
    }
    
    public Profile createProfile(Profile profile) {
        return profileRepository.save(profile);
    }

    public Profile updateProfile(Long userId, Profile updatedProfile) {
        Optional<Profile> existingProfileOptional = profileRepository.findByUserId(userId);
        if (existingProfileOptional.isPresent()) {
            Profile existingProfile = existingProfileOptional.get();
            existingProfile.setDisplayName(updatedProfile.getDisplayName());
            existingProfile.setBio(updatedProfile.getBio());
            existingProfile.setProfilePictureUrl(updatedProfile.getProfilePictureUrl());
            // Only update counts if explicitly provided, otherwise keep existing
            if (updatedProfile.getPostCount() != null) {
                existingProfile.setPostCount(updatedProfile.getPostCount());
            }
            if (updatedProfile.getFollowerCount() != null) {
                existingProfile.setFollowerCount(updatedProfile.getFollowerCount());
            }
            if (updatedProfile.getFollowingCount() != null) {
                existingProfile.setFollowingCount(updatedProfile.getFollowingCount());
            }
            return profileRepository.save(existingProfile);
        }
        return null; // Or throw an exception if profile not found
    }

    public void deleteProfile(Long userId) {
        profileRepository.findByUserId(userId).ifPresent(profileRepository::delete);
    }

    // Methods to update counts (e.g., when a post is created/deleted, or follow/unfollow happens)
    public void incrementPostCount(Long userId) {
        profileRepository.findByUserId(userId).ifPresent(profile -> {
            profile.setPostCount(profile.getPostCount() + 1);
            profileRepository.save(profile);
        });
    }

    public void decrementPostCount(Long userId) {
        profileRepository.findByUserId(userId).ifPresent(profile -> {
            if (profile.getPostCount() > 0) {
                profile.setPostCount(profile.getPostCount() - 1);
                profileRepository.save(profile);
            }
        });
    }

    public void incrementFollowerCount(Long userId) {
        profileRepository.findByUserId(userId).ifPresent(profile -> {
            profile.setFollowerCount(profile.getFollowerCount() + 1);
            profileRepository.save(profile);
        });
    }

    public void decrementFollowerCount(Long userId) {
        profileRepository.findByUserId(userId).ifPresent(profile -> {
            if (profile.getFollowerCount() > 0) {
                profile.setFollowerCount(profile.getFollowerCount() - 1);
                profileRepository.save(profile);
            }
        });
    }

    public void incrementFollowingCount(Long userId) {
        profileRepository.findByUserId(userId).ifPresent(profile -> {
            profile.setFollowingCount(profile.getFollowingCount() + 1);
            profileRepository.save(profile);
        });
    }

    public void decrementFollowingCount(Long userId) {
        profileRepository.findByUserId(userId).ifPresent(profile -> {
            if (profile.getFollowingCount() > 0) {
                profile.setFollowingCount(profile.getFollowingCount() - 1);
                profileRepository.save(profile);
            }
        });
    }
} 