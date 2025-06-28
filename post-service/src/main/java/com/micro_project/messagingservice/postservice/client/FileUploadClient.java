package com.micro_project.messagingservice.postservice.client;

import com.micro_project.messagingservice.postservice.dto.ImageUploadResponseDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

@FeignClient(name = "FILE-UPLOAD-SERVICE")
public interface FileUploadClient {

    @PostMapping(value = "/api/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ResponseEntity<ImageUploadResponseDto> uploadImage(@RequestPart("file") MultipartFile file);
} 