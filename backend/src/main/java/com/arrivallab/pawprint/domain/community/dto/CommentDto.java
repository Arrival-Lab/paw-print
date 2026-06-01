package com.arrivallab.pawprint.domain.community.dto;

import com.arrivallab.pawprint.domain.community.entity.Comment;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;

public record CommentDto(
        Long id,
        String content,
        Long authorId,
        String authorNickname,
        String authorProfileImage,
        // KST offset(+09:00) 포함 — 프론트 zone-aware 파싱용. PostDto 와 동일 이유.
        OffsetDateTime createdAt
) {
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    public static CommentDto from(Comment c) {
        String nickname = c.getUser().getNickname() != null ? c.getUser().getNickname() : "익명";
        OffsetDateTime created = c.getCreatedAt() == null
                ? null
                : c.getCreatedAt().atZone(KST).toOffsetDateTime();
        return new CommentDto(c.getId(), c.getContent(),
                c.getUser().getId(), nickname, c.getUser().getProfileImage(), created);
    }
}
