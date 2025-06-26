package com.micro_project.followersservice.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class FollowResponseDTO {
    private String id;
    private UserDTO follower;
    private UserDTO following;
    private LocalDateTime createdAt;
} 