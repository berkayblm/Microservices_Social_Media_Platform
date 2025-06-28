package com.socialapp.profileservice.client;

import com.socialapp.profileservice.dto.ImageUploadResponseDto;
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