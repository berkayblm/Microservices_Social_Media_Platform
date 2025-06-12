package com.micro_project.postservice.repository;

import com.micro_project.postservice.entity.Like;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LikeRepository extends JpaRepository<Like, Long> {
    Optional<Like> findByPostIdAndUserId(Long postId, Long userId);
    int countByPostId(Long postId);
    void deleteByPostIdAndUserId(Long postId, Long userId);
    boolean existsByPostIdAndUserId(Long postId, Long userId);
}
