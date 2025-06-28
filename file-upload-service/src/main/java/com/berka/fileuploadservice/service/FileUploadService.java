package com.berka.fileuploadservice.service;

import com.berka.fileuploadservice.dto.response.ImageUploadResponseDto;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public interface FileUploadService {

    ImageUploadResponseDto uploadImage(MultipartFile file);
}
