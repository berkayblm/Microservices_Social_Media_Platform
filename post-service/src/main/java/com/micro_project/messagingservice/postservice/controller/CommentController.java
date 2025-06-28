package com.micro_project.messagingservice.postservice.controller;

import com.micro_project.messagingservice.postservice.dto.CommentCreateRequest;
import com.micro_project.messagingservice.postservice.dto.CommentDto;
import com.micro_project.messagingservice.postservice.dto.CommentUpdateRequest;
import com.micro_project.messagingservice.postservice.dto.PagedCommentResponse;
import com.micro_project.messagingservice.postservice.service.CommentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts/comments")
public class CommentController {

    private final CommentService commentService;

    @Autowired
    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping("/post/{postId}")
    public ResponseEntity<PagedCommentResponse> getCommentsByPostId(
            @PathVariable Long postId,
            @RequestHeader(value = "userId") Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<CommentDto> commentsPage = commentService.getCommentsByPostId(postId,userId,  page, size);

        PagedCommentResponse response = new PagedCommentResponse(
                commentsPage.getContent(),
                commentsPage.getNumber(),
                commentsPage.getTotalElements(),
                commentsPage.getTotalPages()
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/post/{postId}")
    public ResponseEntity<CommentDto> addComment(
            @PathVariable Long postId,
            @RequestHeader(value = "userId") Long userId,
            @Valid @RequestBody CommentCreateRequest request) {

        CommentDto commentDto = commentService.addComment(postId, userId, request.getContent());
        return ResponseEntity.status(HttpStatus.CREATED).body(commentDto);
    }


    @PutMapping("/{id}")
    public ResponseEntity<CommentDto> updateComment(
            @PathVariable Long id,
            @RequestHeader(value = "userId") Long userId,
            @Valid @RequestBody CommentUpdateRequest request) {

        try {
            CommentDto updatedComment = commentService.updateComment(id, userId, request.getContent());
            return ResponseEntity.ok(updatedComment);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id,
                                              @RequestHeader(value = "userId") Long userId) {
        try {
            commentService.deleteComment(id, userId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

}
