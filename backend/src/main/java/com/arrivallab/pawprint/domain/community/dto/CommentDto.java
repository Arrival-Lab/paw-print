package com.arrivallab.pawprint.domain.community.dto;

import com.arrivallab.pawprint.domain.community.entity.Comment;

import java.time.LocalDateTime;

public record CommentDto(
        Long id,
        String content,
        Long authorId,
        String authorNickname,
        String authorProfileImage,
        LocalDateTime createdAt
) {
    public static CommentDto from(Comment c) {
        String nickname = c.getUser().getNickname() != null ? c.getUser().getNickname() : "익명";
        return new CommentDto(c.getId(), c.getContent(),
                c.getUser().getId(), nickname, c.getUser().getProfileImage(), c.getCreatedAt());
    }
}
