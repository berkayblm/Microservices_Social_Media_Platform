package com.micro_project.postservice.controller;

import com.micro_project.postservice.dto.LikeCountResponse;
import com.micro_project.postservice.dto.LikeRequest;
import com.micro_project.postservice.dto.LikeResponse;
import com.micro_project.postservice.service.LikeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/posts/likes")
public class LikeController {

    private final LikeService likeService;

    @Autowired
    public LikeController(LikeService likeService) {
        this.likeService = likeService;
    }

    @PostMapping("/post/{postId}")
    public ResponseEntity<LikeResponse> toggleLike(
            @PathVariable Long postId,
            @RequestHeader(value = "userId") Long userId,
            @RequestBody(required = false) LikeRequest request) {

        String reactionType = request != null && request.getReactionType() != null
                ? request.getReactionType() : "LIKE";

        LikeResponse response = likeService.toggleLike(postId, userId, reactionType);
        return ResponseEntity.ok(response);
    }


    @GetMapping("/post/{postId}/count")
    public ResponseEntity<LikeCountResponse> getLikeCount(@PathVariable Long postId) {
        int likeCount = likeService.getLikeCount(postId);

        LikeCountResponse response = new LikeCountResponse(likeCount);

        return ResponseEntity.ok(response);
    }
}

