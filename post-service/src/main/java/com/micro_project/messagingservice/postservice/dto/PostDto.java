package com.micro_project.messagingservice.postservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostDto {
    private Long id;
    private String title;
    private String content;
    private String imageUrl;
    private String username;
    private Long userId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UserDto author;
    private int commentCount;
    private int likeCount;
    private List<CommentDto> comments;
    private boolean likedByCurrentUser;
}
