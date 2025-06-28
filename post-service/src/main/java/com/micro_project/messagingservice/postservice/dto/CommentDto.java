package com.micro_project.messagingservice.postservice.dto;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentDto {
    private Long id;
    private Long postId;
    private String content;
    private String username;
    private Long userId;
    private LocalDateTime createdAt;
    private Boolean isAuthor;
}

