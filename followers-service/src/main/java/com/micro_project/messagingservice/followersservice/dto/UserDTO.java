package com.micro_project.messagingservice.followersservice.dto;

import lombok.Data;

@Data
public class UserDTO {
    private Long id;
    private String username;
    private String displayName;
    private String profilePhotoUrl;
    private String bio;
} 