package com.micro_project.messagingservice.userservice.dto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
public class UserDto {
    private Long id;
    private String username;
    private String token;
    private String profilePhoto;
    private String displayName;
}
