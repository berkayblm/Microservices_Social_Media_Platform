package com.micro_project.messagingservice.postservice.service;

import com.micro_project.messagingservice.postservice.dto.LikeResponse;
import com.micro_project.messagingservice.postservice.entity.Like;
import com.micro_project.messagingservice.postservice.entity.Post;
import com.micro_project.messagingservice.postservice.repository.LikeRepository;
import com.micro_project.messagingservice.postservice.repository.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
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
    public LikeResponse toggleLike(Long postId, Long userId, String reactionType) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        Optional<Like> existingLike = likeRepository.findByPostIdAndUserId(postId, userId);
        boolean isLiked;

        if (existingLike.isPresent()) {
            // If like exists and reaction type is the same, remove the like
            if (existingLike.get().getReactionType().equals(reactionType)) {
                likeRepository.delete(existingLike.get());
                isLiked = false; // Indicates like was removed
            } else {
                // Update reaction type
                Like like = existingLike.get();
                like.setReactionType(reactionType);
                likeRepository.save(like);
                isLiked = true; // Indicates like was updated
            }
        } else {
            // Create new like
            Like like = new Like();
            like.setPost(post);
            like.setUserId(userId);
            like.setReactionType(reactionType);

            likeRepository.save(like);
            isLiked = true;
        }

        int likeCount = likeRepository.countByPostId(postId);
        return new LikeResponse(isLiked, likeCount);
    }


    public int getLikeCount(Long postId) {
        return likeRepository.countByPostId(postId);
    }

    public boolean hasUserLiked(Long postId, Long userId) {
        return likeRepository.existsByPostIdAndUserId(postId, userId);
    }

}
