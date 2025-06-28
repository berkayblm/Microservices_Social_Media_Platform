package com.micro_project.messagingservice.userservice.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.Map;

@FeignClient(name = "profile-service")
public interface ProfileServiceClient {
    
    @GetMapping("/api/profiles/{userId}")
    Map<String, Object> getProfileByUserId(@PathVariable Long userId);
} 