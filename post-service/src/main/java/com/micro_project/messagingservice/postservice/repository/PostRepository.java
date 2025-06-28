package com.micro_project.messagingservice.postservice.repository;

import com.micro_project.messagingservice.postservice.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<Post> findByUserId(Long userId, Pageable pageable);
    List<Post> findByUserIdOrderByCreatedAtDesc(Long userId);
}

