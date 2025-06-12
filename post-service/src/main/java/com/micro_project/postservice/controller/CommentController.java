package com.micro_project.postservice.controller;

import com.micro_project.postservice.dto.CommentDto;
import com.micro_project.postservice.service.CommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/comments")
public class CommentController {

    private final CommentService commentService;

    @Autowired
    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping("/post/{postId}")
    public ResponseEntity<Map<String, Object>> getCommentsByPostId(
            @PathVariable Long postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<CommentDto> commentsPage = commentService.getCommentsByPostId(postId, page, size);

        Map<String, Object> response = new HashMap<>();
        response.put("comments", commentsPage.getContent());
        response.put("currentPage", commentsPage.getNumber());
        response.put("totalItems", commentsPage.getTotalElements());
        response.put("totalPages", commentsPage.getTotalPages());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/post/{postId}")
    public ResponseEntity<CommentDto> addComment(
            @PathVariable Long postId,
            @RequestBody Map<String, String> request) {

        String content = request.get("content");

        if (content == null || content.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        CommentDto commentDto = commentService.addComment(postId, content);
        return ResponseEntity.status(HttpStatus.CREATED).body(commentDto);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CommentDto> updateComment(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {

        String content = request.get("content");

        if (content == null || content.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        try {
            CommentDto updatedComment = commentService.updateComment(id, content);
            return ResponseEntity.ok(updatedComment);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id) {
        try {
            commentService.deleteComment(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
}
