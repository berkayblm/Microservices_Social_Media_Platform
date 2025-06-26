package com.micro_project.followersservice.service;

import com.micro_project.followersservice.client.UserServiceClient;
import com.micro_project.followersservice.dto.FollowResponseDTO;
import com.micro_project.followersservice.dto.UserDTO;
import com.micro_project.followersservice.model.Follow;
import com.micro_project.followersservice.repository.FollowRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FollowService {
    private final FollowRepository followRepository;
    private final UserServiceClient userServiceClient;

    public FollowResponseDTO followUser(Long followerId, Long followingId) {
        if (followerId.equals(followingId)) {
            throw new IllegalArgumentException("Users cannot follow themselves");
        }

        if (followRepository.findByFollowerIdAndFollowingId(followerId, followingId).isPresent()) {
            throw new IllegalStateException("Already following this user");
        }

        Follow follow = new Follow(followerId, followingId);
        follow = followRepository.save(follow);
        return convertToFollowResponseDTO(follow);
    }

    public void unfollowUser(Long followerId, Long followingId) {
        followRepository.deleteByFollowerIdAndFollowingId(followerId, followingId);
    }

    public List<FollowResponseDTO> getFollowers(Long userId) {
        List<Follow> follows = followRepository.findByFollowingId(userId);
        return follows.stream()
                .map(this::convertToFollowResponseDTO)
                .collect(Collectors.toList());
    }

    public List<FollowResponseDTO> getFollowing(Long userId) {
        List<Follow> follows = followRepository.findByFollowerId(userId);
        return follows.stream()
                .map(this::convertToFollowResponseDTO)
                .collect(Collectors.toList());
    }

    public long getFollowersCount(Long userId) {
        return followRepository.countByFollowingId(userId);
    }

    public long getFollowingCount(Long userId) {
        return followRepository.countByFollowerId(userId);
    }

    public boolean isFollowing(Long followerId, Long followingId) {
        return followRepository.findByFollowerIdAndFollowingId(followerId, followingId).isPresent();
    }

    private FollowResponseDTO convertToFollowResponseDTO(Follow follow) {
        FollowResponseDTO dto = new FollowResponseDTO();
        dto.setId(follow.getId());
        dto.setCreatedAt(follow.getCreatedAt());
        
        // Get user information from user service
        UserDTO follower = userServiceClient.getUserById(follow.getFollowerId());
        UserDTO following = userServiceClient.getUserById(follow.getFollowingId());
        
        dto.setFollower(follower);
        dto.setFollowing(following);
        
        return dto;
    }
} 