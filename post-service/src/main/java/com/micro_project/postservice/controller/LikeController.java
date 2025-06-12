package com.micro_project.postservice.controller;

import com.micro_project.postservice.service.LikeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/likes")
public class LikeController {

    private final LikeService likeService;

    @Autowired
    public LikeController(LikeService likeService) {
        this.likeService = likeService;
    }

    @PostMapping("/post/{postId}")
    public ResponseEntity<Map<String, Object>> toggleLike(
            @PathVariable Long postId,
            @RequestBody(required = false) Map<String, String> request) {

        String reactionType = request != null && request.containsKey("reactionType")
                ? request.get("reactionType") : "LIKE";

        boolean isLiked = likeService.toggleLike(postId, reactionType);
        int likeCount = likeService.getLikeCount(postId);

        Map<String, Object> response = new HashMap<>();
        response.put("liked", isLiked);
        response.put("likeCount", likeCount);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/post/{postId}/count")
    public ResponseEntity<Map<String, Object>> getLikeCount(@PathVariable Long postId) {
        int likeCount = likeService.getLikeCount(postId);

        Map<String, Object> response = new HashMap<>();
        response.put("likeCount", likeCount);

        return ResponseEntity.ok(response);
    }
}
