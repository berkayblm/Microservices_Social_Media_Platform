package com.berka.fileuploadservice.controller;

import com.berka.fileuploadservice.dto.response.ImageUploadResponseDto;
import com.berka.fileuploadservice.service.FileUploadService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/upload")
public class FileUploadController {

    private final FileUploadService fileUploadService;

    @Autowired
    public FileUploadController(FileUploadService fileUploadService) {
        this.fileUploadService = fileUploadService;
    }

    @PostMapping
    public ResponseEntity<ImageUploadResponseDto> uploadImage(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(fileUploadService.uploadImage(file));

    }
}
