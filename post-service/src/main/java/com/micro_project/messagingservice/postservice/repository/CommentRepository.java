package com.micro_project.messagingservice.postservice.repository;

import com.micro_project.messagingservice.postservice.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByPostIdOrderByCreatedAtDesc(Long postId);
    Page<Comment> findByPostId(Long postId, Pageable pageable);
    int countByPostId(Long postId);
}
