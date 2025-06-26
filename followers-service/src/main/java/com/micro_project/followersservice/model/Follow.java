package com.micro_project.followersservice.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "follows")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Follow {
    @Id
    private String id;
    
    private Long followerId;  // The user who is following
    private Long followingId; // The user being followed
    private LocalDateTime createdAt;
    
    public Follow(Long followerId, Long followingId) {
        this.followerId = followerId;
        this.followingId = followingId;
        this.createdAt = LocalDateTime.now();
    }
} 