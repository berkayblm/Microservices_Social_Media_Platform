package com.micro_project.postservice.service;

import com.micro_project.postservice.client.UserClient;
import com.micro_project.postservice.dto.PostDto;
import com.micro_project.postservice.dto.UserDto;
import com.micro_project.postservice.entity.Post;
import com.micro_project.postservice.repository.CommentRepository;
import com.micro_project.postservice.repository.LikeRepository;
import com.micro_project.postservice.repository.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class PostService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final LikeRepository likeRepository;
    private final CommentService commentService;
    private final UserClient userClient;

    @Autowired
    public PostService(
            PostRepository postRepository,
            CommentRepository commentRepository,
            LikeRepository likeRepository,
            CommentService commentService, UserClient userClient) {
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.likeRepository = likeRepository;
        this.commentService = commentService;
        this.userClient = userClient;
    }

    public Page<PostDto> getAllPosts(int page, int size, Long userId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Post> postsPage = postRepository.findAll(pageable);
        return postsPage.map(post -> convertToDto(post, userId));
    }


    public PostDto getPostById(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + postId));
        return convertToDto(post, userId);
    }


    public Page<PostDto> getPostsByUserId(Long profileUserId, int page, int size, Long currentUserId) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Post> postsPage = postRepository.findByUserId(profileUserId, pageable);
        return postsPage.map(post -> convertToDto(post, currentUserId));
    }


    @Transactional
    public PostDto createPost(String title, String content, Long userId) {
        Post post = new Post();
        post.setTitle(title);
        post.setContent(content);
        post.setUserId(userId);
        post.setCreatedAt(LocalDateTime.now());
        Post savedPost = postRepository.save(post);
        return convertToDto(savedPost, userId);
    }


    @Transactional
    public PostDto updatePost(Long id, String title, String content, Long userId) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + id));

        // Check if the user is the owner of the post
        if (!post.getUserId().equals(userId)) {
            throw new RuntimeException("You don't have permission to update this post");
        }

        post.setTitle(title);
        post.setContent(content);
        post.setUpdatedAt(LocalDateTime.now());

        Post updatedPost = postRepository.save(post);
        return convertToDto(updatedPost, userId);
    }


    @Transactional
    public void deletePost(Long postId, Long userId) {

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getUserId().equals(userId)) {
            throw new RuntimeException("You can only delete your own posts");
        }

        postRepository.delete(post);
    }

    private PostDto convertToDto(Post post, Long currentUserId) {
        PostDto postDto = new PostDto();
        postDto.setId(post.getId());
        postDto.setTitle(post.getTitle());
        postDto.setContent(post.getContent());
        postDto.setCreatedAt(post.getCreatedAt());
        postDto.setUpdatedAt(post.getUpdatedAt());
        postDto.setUserId(post.getUserId());

        // Get comment count
        int commentCount = commentRepository.countByPostId(post.getId());
        postDto.setCommentCount(commentCount);

        // Get like count
        int likeCount = likeRepository.countByPostId(post.getId());
        postDto.setLikeCount(likeCount);

        // Check if current user has liked the post
        boolean hasLiked = false;
        if (currentUserId != null) {
            hasLiked = likeRepository.existsByPostIdAndUserId(post.getId(), currentUserId);
        }
        postDto.setLikedByCurrentUser(hasLiked);
        // Fetch and set author information
        try {
            ResponseEntity<UserDto> userResponse = userClient.getUserById(post.getUserId());
            if (userResponse.getStatusCode().is2xxSuccessful() && userResponse.getBody() != null) {
                postDto.setAuthor(userResponse.getBody());
            }
        } catch (Exception e) {
            // Log error but continue - we don't want post retrieval to fail just because user info is missing
            System.err.println("Error fetching author info for post " + post.getId() + ": " + e.getMessage());
        }

        // Add any other fields you want to include

        return postDto;
    }


}

