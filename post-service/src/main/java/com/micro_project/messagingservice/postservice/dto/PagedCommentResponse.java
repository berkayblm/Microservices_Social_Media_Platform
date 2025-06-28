package com.micro_project.messagingservice.postservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PagedCommentResponse {
    private List<CommentDto> comments;
    private int currentPage;
    private long totalItems;
    private int totalPages;
}

