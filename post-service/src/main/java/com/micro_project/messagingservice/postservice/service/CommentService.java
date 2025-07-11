package com.micro_project.messagingservice.postservice.service;

import com.micro_project.messagingservice.postservice.client.UserClient;
import com.micro_project.messagingservice.postservice.dto.CommentDto;
import com.micro_project.messagingservice.postservice.dto.UserDto;
import com.micro_project.messagingservice.postservice.entity.Comment;
import com.micro_project.messagingservice.postservice.entity.Post;
import com.micro_project.messagingservice.postservice.repository.CommentRepository;
import com.micro_project.messagingservice.postservice.repository.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserClient userClient;

    @Autowired
    public CommentService(CommentRepository commentRepository, PostRepository postRepository, UserClient userClient) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.userClient = userClient;
    }

    public Page<CommentDto> getCommentsByPostId(Long postId, Long loggedInUserId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Comment> commentsPage = commentRepository.findByPostId(postId, pageable);

        return commentsPage.map(comment -> convertToDto(comment, loggedInUserId));
    }

    @Transactional
    public CommentDto addComment(Long postId, Long userId, String content) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        Comment comment = new Comment();
        comment.setPost(post);
        comment.setContent(content);
        comment.setUserId(userId);
        Comment savedComment = commentRepository.save(comment);

        return convertToDto(savedComment, userId);
    }


    @Transactional
    public CommentDto updateComment(Long commentId, Long userId, String content) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        if (!comment.getUserId().equals(userId)) {
            throw new RuntimeException("You can only update your own comments");
        }

        comment.setContent(content);

        Comment updatedComment = commentRepository.save(comment);

        return convertToDto(updatedComment, userId);
    }


    @Transactional
    public void deleteComment(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        if (!comment.getUserId().equals(userId)) {
            throw new RuntimeException("You can only delete your own comments");
        }

        commentRepository.delete(comment);
    }

    private CommentDto convertToDto(Comment comment, Long loggedInUserId) {
        CommentDto dto = new CommentDto();
        dto.setId(comment.getId());
        dto.setPostId(comment.getPost().getId());
        dto.setContent(comment.getContent());
        dto.setUserId(comment.getUserId());
        dto.setCreatedAt(comment.getCreatedAt());

        // Check if the logged-in user is the author of this comment
        dto.setIsAuthor(loggedInUserId != null && loggedInUserId.equals(comment.getUserId()));

        try {
            ResponseEntity<UserDto> userResponse = userClient.getUserById(comment.getUserId());
            if (userResponse.getStatusCode().is2xxSuccessful() && userResponse.getBody() != null) {
                dto.setUsername(String.valueOf(userResponse.getBody().getUsername(

                )));
            }
        } catch (Exception e) {
            // Log error but continue - we don't want post retrieval to fail just because user info is missing
            System.err.println("Error fetching author info for post " + comment.getId() + ": " + e.getMessage());
        }

        return dto;
    }

}

