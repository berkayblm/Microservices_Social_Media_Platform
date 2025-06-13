package com.micro_project.postservice.client;


import com.micro_project.postservice.dto.UserDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "user-service", url = "http://localhost:8081")
public interface UserClient {

    @GetMapping("/api/users/{id}")
    ResponseEntity<UserDto> getUserById(@PathVariable Long id);

    @GetMapping("/api/users/username/{username}")
    ResponseEntity<UserDto> getUserByUsername(@PathVariable String username);
}
