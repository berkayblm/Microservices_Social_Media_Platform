package com.micro_project.messagingservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendMessageRequest {
    @NotBlank
    private String receiverId;
    @NotBlank
    private String content;
} 