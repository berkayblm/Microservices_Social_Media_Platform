package com.micro_project.messagingservice.service;

import com.micro_project.messagingservice.dto.MessageDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final long MESSAGE_TTL_SECONDS = 3600; // 1 hour

    private String getConversationKey(String user1, String user2) {
        // Ensure consistent key order
        return "conversation:" + (user1.compareTo(user2) < 0 ? user1 + ":" + user2 : user2 + ":" + user1);
    }

    public void sendMessage(String senderId, String receiverId, String content) throws Exception {
        String messageId = UUID.randomUUID().toString();
        long timestamp = System.currentTimeMillis();
        MessageDto message = new MessageDto();
        message.setId(messageId);
        message.setSenderId(senderId);
        message.setReceiverId(receiverId);
        message.setContent(content);
        message.setTimestamp(timestamp);

        String messageKey = "message:" + messageId;
        String messageJson = objectMapper.writeValueAsString(message);

        // Store message with TTL
        redisTemplate.opsForValue().set(messageKey, messageJson, Duration.ofSeconds(MESSAGE_TTL_SECONDS));

        // Add messageId to conversation sorted set
        String convKey = getConversationKey(senderId, receiverId);
        redisTemplate.opsForZSet().add(convKey, messageId, timestamp);
    }

    public List<MessageDto> getConversation(String user1, String user2) {
        String convKey = getConversationKey(user1, user2);
        Set<String> messageIds = redisTemplate.opsForZSet().range(convKey, 0, -1);
        if (messageIds == null) return Collections.emptyList();

        List<MessageDto> messages = new ArrayList<>();
        for (String messageId : messageIds) {
            String messageKey = "message:" + messageId;
            String messageJson = redisTemplate.opsForValue().get(messageKey);
            if (messageJson != null) {
                try {
                    messages.add(objectMapper.readValue(messageJson, MessageDto.class));
                } catch (Exception ignored) {}
            } else {
                // Message expired, remove from sorted set
                redisTemplate.opsForZSet().remove(convKey, messageId);
            }
        }
        // Sort by timestamp ascending
        return messages.stream()
                .sorted(Comparator.comparingLong(MessageDto::getTimestamp))
                .collect(Collectors.toList());
    }

    // Optional: List of users you have conversations with
    public Set<String> getConversationPartners(String userId) {
        Set<String> keys = redisTemplate.keys("conversation:*");
        Set<String> partners = new HashSet<>();
        if (keys != null) {
            for (String key : keys) {
                String[] parts = key.split(":");
                if (parts.length == 3) {
                    if (parts[1].equals(userId)) partners.add(parts[2]);
                    else if (parts[2].equals(userId)) partners.add(parts[1]);
                }
            }
        }
        return partners;
    }
} 