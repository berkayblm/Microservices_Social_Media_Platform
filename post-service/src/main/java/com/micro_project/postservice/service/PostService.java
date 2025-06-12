package com.micro_project.postservice.service;


import com.micro_project.postservice.config.JwtUserDetails;
import com.micro_project.postservice.dto.PostDto;
import com.micro_project.postservice.entity.Post;
import com.micro_project.postservice.repository.CommentRepository;
import com.micro_project.postservice.repository.LikeRepository;
import com.micro_project.postservice.repository.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PostService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final LikeRepository likeRepository;
    private final CommentService commentService;

    @Autowired
    public PostService(
            PostRepository postRepository,
            CommentRepository commentRepository,
            LikeRepository likeRepository,
            CommentService commentService) {
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.likeRepository = likeRepository;
        this.commentService = commentService;
    }

    public Page<PostDto> getAllPosts(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Post> postsPage = postRepository.findAllByOrderByCreatedAtDesc(pageable);

        return postsPage.map(this::convertToDto);
    }

    public PostDto getPostById(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        return convertToDto(post);
    }

    public Page<PostDto> getPostsByUserId(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Post> postsPage = postRepository.findByUserId(userId, pageable);

        return postsPage.map(this::convertToDto);
    }

    @Transactional
    public PostDto createPost(String title, String content) {
        //JwtUserDetails userDetails = getCurrentUser();
        //TODO: retrieve user info through feign

        Post post = new Post();
        post.setTitle(title);
        post.setContent(content);
        post.setUserId(userDetails.getUserId());
        post.setUsername(userDetails.getUsername());

        Post savedPost = postRepository.save(post);

        return convertToDto(savedPost);
    }

    @Transactional
    public PostDto updatePost(Long postId, String title, String content) {
        JwtUserDetails userDetails = getCurrentUser();

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getUserId().equals(userDetails.getUserId())) {
            throw new RuntimeException("You can only update your own posts");
        }

        post.setTitle(title);
        post.setContent(content);

        Post updatedPost = postRepository.save(post);

        return convertToDto(updatedPost);
    }

    @Transactional
    public void deletePost(Long postId) {
        JwtUserDetails userDetails = getCurrentUser();

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getUserId().equals(userDetails.getUserId())) {
            throw new RuntimeException("You can only delete your own posts");
        }

        postRepository.delete(post);
    }

    private PostDto convertToDto(Post post) {
        JwtUserDetails userDetails = getCurrentUser();

        PostDto dto = new PostDto();
        dto.setId(post.getId());
        dto.setTitle(post.getTitle());
        dto.setContent(post.getContent());
        dto.setUsername(post.getUsername());
        dto.setUserId(post.getUserId());
        dto.setCreatedAt(post.getCreatedAt());
        dto.setUpdatedAt(post.getUpdatedAt());

        int commentCount = commentRepository.countByPostId(post.getId());
        dto.setCommentCount(commentCount);

        int likeCount = likeRepository.countByPostId(post.getId());
        dto.setLikeCount(likeCount);

        boolean likedByCurrentUser = likeRepository.existsByPostIdAndUserId(post.getId(), userDetails.getUserId());
        dto.setLikedByCurrentUser(likedByCurrentUser);

        // Only fetch the first 3 comments for preview
        dto.setComments(commentService.getCommentsByPostId(post.getId(), 0, 3).getContent());

        return dto;
    }

    private JwtUserDetails getCurrentUser() {
        return (JwtUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}

