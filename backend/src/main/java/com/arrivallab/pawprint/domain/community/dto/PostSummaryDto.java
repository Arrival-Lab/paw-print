package com.arrivallab.pawprint.domain.community.dto;

import com.arrivallab.pawprint.domain.community.entity.Post;
import com.arrivallab.pawprint.domain.community.entity.PostTag;

import java.time.LocalDateTime;

public record PostSummaryDto(
        Long id,
        PostTag tag,
        String title,
        String contentPreview,
        String authorNickname,
        String authorProfileImage,
        String thumbnailUrl,
        int photoCount,
        int likeCount,
        int commentCount,
        LocalDateTime createdAt
) {
    public static PostSummaryDto from(Post p) {
        return from(p, null, 0);
    }

    public static PostSummaryDto from(Post p, String thumbnailUrl, int photoCount) {
        String preview = p.getContent().length() > 100
                ? p.getContent().substring(0, 100) + "..." : p.getContent();
        String nickname = p.getUser().getNickname() != null ? p.getUser().getNickname() : "익명";
        return new PostSummaryDto(p.getId(), p.getTag(), p.getTitle(), preview,
                nickname, p.getUser().getProfileImage(),
                thumbnailUrl, photoCount,
                p.getLikeCount(), p.getCommentCount(), p.getCreatedAt());
    }
}
