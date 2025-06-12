package com.micro_project.userservice.dto;

import lombok.*;

@Setter
@Getter
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponseDto {
    private String token;
    private String username;
    private String email;
}
