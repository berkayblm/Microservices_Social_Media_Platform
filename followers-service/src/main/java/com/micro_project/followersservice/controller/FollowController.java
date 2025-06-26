package com.micro_project.followersservice.controller;

import com.micro_project.followersservice.dto.FollowResponseDTO;
import com.micro_project.followersservice.service.FollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/follows")
@RequiredArgsConstructor
public class FollowController {
    private final FollowService followService;

    @PostMapping("/{followerId}/follow/{followingId}")
    public ResponseEntity<FollowResponseDTO> followUser(
            @PathVariable Long followerId,
            @PathVariable Long followingId) {
        try {
            FollowResponseDTO follow = followService.followUser(followerId, followingId);
            return ResponseEntity.ok(follow);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{followerId}/unfollow/{followingId}")
    public ResponseEntity<Void> unfollowUser(
            @PathVariable Long followerId,
            @PathVariable Long followingId) {
        followService.unfollowUser(followerId, followingId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{userId}/followers")
    public ResponseEntity<List<FollowResponseDTO>> getFollowers(@PathVariable Long userId) {
        return ResponseEntity.ok(followService.getFollowers(userId));
    }

    @GetMapping("/{userId}/following")
    public ResponseEntity<List<FollowResponseDTO>> getFollowing(@PathVariable Long userId) {
        return ResponseEntity.ok(followService.getFollowing(userId));
    }

    @GetMapping("/{userId}/counts")
    public ResponseEntity<Map<String, Long>> getFollowCounts(@PathVariable Long userId) {
        Map<String, Long> counts = Map.of(
            "followers", followService.getFollowersCount(userId),
            "following", followService.getFollowingCount(userId)
        );
        return ResponseEntity.ok(counts);
    }

    @GetMapping("/{followerId}/is-following/{followingId}")
    public ResponseEntity<Boolean> isFollowing(
            @PathVariable Long followerId,
            @PathVariable Long followingId) {
        return ResponseEntity.ok(followService.isFollowing(followerId, followingId));
    }
} 