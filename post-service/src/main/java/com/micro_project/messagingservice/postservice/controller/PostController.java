package com.micro_project.messagingservice.postservice.controller;

import com.micro_project.messagingservice.postservice.client.FileUploadClient;
import com.micro_project.messagingservice.postservice.dto.ImageUploadResponseDto;
import com.micro_project.messagingservice.postservice.dto.PagedPostResponse;
import com.micro_project.messagingservice.postservice.dto.PostCreateRequest;
import com.micro_project.messagingservice.postservice.dto.PostDto;
import com.micro_project.messagingservice.postservice.dto.PostUpdateRequest;
import com.micro_project.messagingservice.postservice.service.PostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;
    private final FileUploadClient fileUploadClient;

    @Autowired
    public PostController(PostService postService, FileUploadClient fileUploadClient) {
        this.postService = postService;
        this.fileUploadClient = fileUploadClient;
    }

    @GetMapping
    public ResponseEntity<PagedPostResponse> getAllPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestHeader(value = "userId", required = false) Long userId,
            @RequestHeader(value = "loggedInUser", required = false) String username) {

        // Log or use the userId and username as needed
        System.out.println("Request received from user: " + username + " (ID: " + userId + ")");

        Page<PostDto> postsPage = postService.getAllPosts(page, size, userId);

        PagedPostResponse response = new PagedPostResponse(
                postsPage.getContent(),
                postsPage.getNumber(),
                postsPage.getTotalElements(),
                postsPage.getTotalPages()
        );

        return ResponseEntity.ok(response);

    }

    @GetMapping("/{id}")
    public ResponseEntity<PostDto> getPostById(
            @PathVariable Long id,
            @RequestHeader(value = "userId", required = false) Long userId) {

        PostDto post = postService.getPostById(id, userId);
        return ResponseEntity.ok(post);
    }


    @GetMapping("/user/{userId}")
    public ResponseEntity<PagedPostResponse> getPostsByUserId(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestHeader(value = "userId", required = false) Long loggedInUserId,
            @RequestHeader(value = "loggedInUser", required = false) String username) {

        // Log or use the userId and username as needed
        System.out.println("User " + username + " (ID: " + loggedInUserId + ") accessing posts for user ID: " + userId);

        Page<PostDto> postsPage = postService.getPostsByUserId(userId, page, size, loggedInUserId);

        PagedPostResponse response = new PagedPostResponse(
                postsPage.getContent(),
                postsPage.getNumber(),
                postsPage.getTotalElements(),
                postsPage.getTotalPages()
        );

        return ResponseEntity.ok(response);

    }

    @PostMapping
    public ResponseEntity<PostDto> createPost(
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestHeader(value = "userId") Long userId,
            @RequestHeader(value = "loggedInUser") String username) {

        String imageUrl = null;
        
        // Upload image if provided
        if (file != null && !file.isEmpty()) {
            try {
                ResponseEntity<ImageUploadResponseDto> uploadResponse = fileUploadClient.uploadImage(file);
                if (uploadResponse.getStatusCode().is2xxSuccessful() && uploadResponse.getBody() != null) {
                    imageUrl = uploadResponse.getBody().getImageUrl();
                }
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
            }
        }

        PostDto createdPost = postService.createPost(title, content, userId, imageUrl);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdPost);
    }


    @PutMapping("/{id}")
    public ResponseEntity<PostDto> updatePost(
            @PathVariable Long id,
            @RequestParam("title") String title,
            @RequestParam("content") String content,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestHeader(value = "userId") Long userId,
            @RequestHeader(value = "loggedInUser") String username) {

        if (title == null || title.isEmpty() || content == null || content.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        try {
            String imageUrl = null;
            
            // Upload new image if provided
            if (file != null && !file.isEmpty()) {
                try {
                    ResponseEntity<ImageUploadResponseDto> uploadResponse = fileUploadClient.uploadImage(file);
                    if (uploadResponse.getStatusCode().is2xxSuccessful() && uploadResponse.getBody() != null) {
                        imageUrl = uploadResponse.getBody().getImageUrl();
                    }
                } catch (Exception e) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(null);
                }
            }

            PostDto updatedPost = postService.updatePost(id, title, content, userId, imageUrl);

            return ResponseEntity.ok(updatedPost);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(
            @PathVariable Long id,
            @RequestHeader(value = "userId") String userId,
            @RequestHeader(value = "loggedInUser") String username) {

        try {
            // Pass the userId for authorization check
            Long userIdLong = Long.parseLong(userId);

            // You'll need to modify your service method to accept the userId parameter for ownership verification
            postService.deletePost(id, userIdLong);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

}
