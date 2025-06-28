package com.micro_project.messagingservice.dto;

import lombok.Data;

@Data
public class MessageDto {
    private String id;
    private String senderId;
    private String receiverId;
    private String content;
    private long timestamp;
} 