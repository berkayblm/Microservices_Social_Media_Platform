package com.micro_project.postservice.controller;

import com.micro_project.postservice.dto.PostDto;
import com.micro_project.postservice.service.PostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/posts")
public class PostController {

    private final PostService postService;

    @Autowired
    public PostController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<PostDto> postsPage = postService.getAllPosts(page, size);

        Map<String, Object> response = new HashMap<>();
        response.put("posts", postsPage.getContent());
        response.put("currentPage", postsPage.getNumber());
        response.put("totalItems", postsPage.getTotalElements());
        response.put("totalPages", postsPage.getTotalPages());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostDto> getPostById(@PathVariable Long id) {
        PostDto post = postService.getPostById(id);
        return ResponseEntity.ok(post);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Object>> getPostsByUserId(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<PostDto> postsPage = postService.getPostsByUserId(userId, page, size);

        Map<String, Object> response = new HashMap<>();
        response.put("posts", postsPage.getContent());
        response.put("currentPage", postsPage.getNumber());
        response.put("totalItems", postsPage.getTotalElements());
        response.put("totalPages", postsPage.getTotalPages());

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<PostDto> createPost(@RequestBody Map<String, String> request) {
        String title = request.get("title");
        String content = request.get("content");

        if (title == null || title.isEmpty() || content == null || content.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        PostDto createdPost = postService.createPost(title, content);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPost);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PostDto> updatePost(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {

        String title = request.get("title");
        String content = request.get("content");

        if (title == null || title.isEmpty() || content == null || content.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        try {
            PostDto updatedPost = postService.updatePost(id, title, content);
            return ResponseEntity.ok(updatedPost);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        try {
            postService.deletePost(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
}
