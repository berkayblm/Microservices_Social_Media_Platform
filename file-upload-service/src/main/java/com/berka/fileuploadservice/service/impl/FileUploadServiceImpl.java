package com.berka.fileuploadservice.service.impl;

import com.berka.fileuploadservice.dto.response.ImageUploadResponseDto;
import com.berka.fileuploadservice.service.FileUploadService;
import com.cloudinary.Cloudinary;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
public class FileUploadServiceImpl implements FileUploadService {

    private final Cloudinary cloudinary;

    @Autowired
    public FileUploadServiceImpl(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    @Override
    public ImageUploadResponseDto uploadImage(MultipartFile file) {
        try{
            HashMap<Object, Object> options = new HashMap<>();
            options.put("folder", "examination");
            Map uploadedFile = cloudinary.uploader().upload(file.getBytes(), options);
            String publicId = (String) uploadedFile.get("public_id");


            String url =  cloudinary.url().secure(true).generate(publicId);

            ImageUploadResponseDto imageUploadResponseDto = ImageUploadResponseDto.builder()
                    .imageUrl(url)
                    .build();

            return imageUploadResponseDto;

        }catch (IOException e){
            e.printStackTrace();
            return null;
        }
    }
}
