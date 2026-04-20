package com.arrivallab.pawprint.domain.community.dto;

import com.arrivallab.pawprint.domain.community.entity.Post;
import com.arrivallab.pawprint.domain.community.entity.PostTag;

import java.time.LocalDateTime;

public record PostSummaryDto(
        Long id,
        PostTag tag,
        String title,
        String contentPreview,
        String authorName,
        String authorProfileImage,
        int likeCount,
        int commentCount,
        LocalDateTime createdAt
) {
    public static PostSummaryDto from(Post p) {
        String preview = p.getContent().length() > 100
                ? p.getContent().substring(0, 100) + "..." : p.getContent();
        return new PostSummaryDto(p.getId(), p.getTag(), p.getTitle(), preview,
                p.getUser().getName(), p.getUser().getProfileImage(),
                p.getLikeCount(), p.getCommentCount(), p.getCreatedAt());
    }
}
