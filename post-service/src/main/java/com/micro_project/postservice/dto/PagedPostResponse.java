package com.micro_project.postservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PagedPostResponse {
    private List<PostDto> posts;
    private int currentPage;
    private long totalItems;
    private int totalPages;
}
