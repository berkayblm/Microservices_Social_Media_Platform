package com.micro_project.postservice.service;

import com.micro_project.postservice.config.JwtUserDetails;
import com.micro_project.postservice.entity.Like;
import com.micro_project.postservice.entity.Post;
import com.micro_project.postservice.repository.LikeRepository;
import com.micro_project.postservice.repository.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class LikeService {

    private final LikeRepository likeRepository;
    private final PostRepository postRepository;

    @Autowired
    public LikeService(LikeRepository likeRepository, PostRepository postRepository) {
        this.likeRepository = likeRepository;
        this.postRepository = postRepository;
    }

    @Transactional
    public boolean toggleLike(Long postId, String reactionType) {
        JwtUserDetails userDetails = getCurrentUser();

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        Optional<Like> existingLike = likeRepository.findByPostIdAndUserId(postId, userDetails.getUserId());

        if (existingLike.isPresent()) {
            // If like exists and reaction type is the same, remove the like
            if (existingLike.get().getReactionType().equals(reactionType)) {
                likeRepository.delete(existingLike.get());
                return false; // Indicates like was removed
            } else {
                // Update reaction type
                Like like = existingLike.get();
                like.setReactionType(reactionType);
                likeRepository.save(like);
                return true; // Indicates like was updated
            }
        } else {
            // Create new like
            Like like = new Like();
            like.setPost(post);
            like.setUserId(userDetails.getUserId());
            like.setUsername(userDetails.getUsername());
            like.setReactionType(reactionType);

            likeRepository.save(like);
            return true; // Indicates like was added
        }
    }

    public int getLikeCount(Long postId) {
        return likeRepository.countByPostId(postId);
    }

    public boolean hasUserLiked(Long postId, Long userId) {
        return likeRepository.existsByPostIdAndUserId(postId, userId);
    }

    private JwtUserDetails getCurrentUser() {
        return (JwtUserDetails) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
