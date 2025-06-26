package com.socialapp.profileservice.service;

import com.socialapp.profileservice.model.Profile;
import com.socialapp.profileservice.repository.ProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class ProfileService {

    @Autowired
    private ProfileRepository profileRepository;

    public Optional<Profile> getProfileByUserId(Long userId) {
        return profileRepository.findByUserId(userId);
    }

    public Optional<Profile> getProfileByUsername(String username) {
        return profileRepository.findByUsername(username);
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