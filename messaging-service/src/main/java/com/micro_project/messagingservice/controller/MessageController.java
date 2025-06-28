package com.micro_project.messagingservice.controller;

import com.micro_project.messagingservice.dto.MessageDto;
import com.micro_project.messagingservice.dto.SendMessageRequest;
import com.micro_project.messagingservice.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {
    private final MessageService messageService;

    // Send a message
    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@RequestBody SendMessageRequest request, @RequestHeader(value = "userId") Long senderId) throws Exception {
        messageService.sendMessage(String.valueOf(senderId), request.getReceiverId(), request.getContent());
        return ResponseEntity.ok().build();
    }

    // Get conversation with another user
    @GetMapping("/conversation/{userId}")
    public ResponseEntity<List<MessageDto>> getConversation(@PathVariable String userId, @RequestHeader(value = "userId") Long currentUserId) {
        List<MessageDto> messages = messageService.getConversation(String.valueOf(currentUserId), userId);
        return ResponseEntity.ok(messages);
    }

    // Get list of users you have conversations with
    @GetMapping("/inbox")
    public ResponseEntity<Set<String>> getInbox(@RequestHeader(value = "userId") Long currentUserId) {
        Set<String> partners = messageService.getConversationPartners(String.valueOf(currentUserId));
        return ResponseEntity.ok(partners);
    }
} 