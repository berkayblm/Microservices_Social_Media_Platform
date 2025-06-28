package com.micro_project.messagingservice.postservice.dto;

import lombok.Data;

@Data
public class UserDto {
    private Long id;
    private String username;
    private String profilePhoto;
    private String displayName;
    // Add any other user fields you want to include
}

