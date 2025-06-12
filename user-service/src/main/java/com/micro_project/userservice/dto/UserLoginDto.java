package com.micro_project.userservice.dto;

import lombok.*;

@Setter
@Getter
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserLoginDto {
    private String username;
    private String password;
}
