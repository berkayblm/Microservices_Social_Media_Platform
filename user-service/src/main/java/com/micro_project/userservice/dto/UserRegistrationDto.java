package com.micro_project.userservice.dto;

import lombok.*;

@Setter
@Getter
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserRegistrationDto {
    // Getters and Setters
    private String username;
    private String email;
    private String password;

}
