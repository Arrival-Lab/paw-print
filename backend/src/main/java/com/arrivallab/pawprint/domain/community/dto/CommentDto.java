package com.arrivallab.pawprint.domain.community.dto;

import com.arrivallab.pawprint.domain.community.entity.Comment;

import java.time.LocalDateTime;

public record CommentDto(
        Long id,
        String content,
        String authorName,
        String authorProfileImage,
        LocalDateTime createdAt
) {
    public static CommentDto from(Comment c) {
        return new CommentDto(c.getId(), c.getContent(),
                c.getUser().getName(), c.getUser().getProfileImage(), c.getCreatedAt());
    }
}
