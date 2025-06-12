package com.micro_project.postservice.service;

import com.micro_project.postservice.config.JwtUserDetails;
import com.micro_project.postservice.dto.CommentDto;
import com.micro_project.postservice.entity.Comment;
import com.micro_project.postservice.entity.Post;
import com.micro_project.postservice.repository.CommentRepository;
import com.micro_project.postservice.repository.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;

    @Autowired
    public CommentService(CommentRepository commentRepository, PostRepository postRepository) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
    }

    public Page<CommentDto> getCommentsByPostId(Long postId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Comment> commentsPage = commentRepository.findByPostId(postId, pageable);

        return commentsPage.map(this::convertToDto);
    }

    @Transactional
    public CommentDto addComment(Long postId, String content) {
        JwtUserDetails userDetails = getCurrentUser();

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        Comment comment = new Comment();
        comment.setPost(post);
        comment.setContent(content);
        comment.setUserId(userDetails.getUserId());
        comment.setUsername(userDetails.getUsername());

        Comment savedComment = commentRepository.save(comment);

        return convertToDto(savedComment);
    }

    @Transactional
    public CommentDto updateComment(Long commentId, String content) {
        JwtUserDetails userDetails = getCurrentUser();

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        if (!comment.getUserId().equals(userDetails.getUserId())) {
            throw new RuntimeException("You can only update your own comments");
        }

        comment.setContent(content);

        Comment updatedComment = commentRepository.save(comment);

        return convertToDto(updatedComment);
    }

    @Transactional
    public void deleteComment(Long commentId) {
        JwtUserDetails userDetails = getCurrentUser();

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        if (!comment.getUserId().equals(userDetails.getUserId())) {
            throw new RuntimeException("You can only delete your own comments");
        }

        commentRepository.delete(comment);
    }

    private CommentDto convertToDto(Comment comment) {
        CommentDto dto = new CommentDto();
        dto.setId(comment.getId());
        dto.setPostId(comment.getPost().getId());
        dto.setContent(comment.getContent());
        dto.setUsername(comment.getUsername());
        dto.setUserId(comment.getUserId());
        dto.setCreatedAt(comment.getCreatedAt());

        return dto;
    }

    private JwtUserDetails getCurrentUser() {
        return (JwtUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}

