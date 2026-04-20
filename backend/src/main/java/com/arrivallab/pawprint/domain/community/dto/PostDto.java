package com.arrivallab.pawprint.domain.community.dto;

import com.arrivallab.pawprint.domain.community.entity.Post;
import com.arrivallab.pawprint.domain.community.entity.PostTag;

import java.time.LocalDateTime;

public record PostDto(
        Long id,
        PostTag tag,
        String title,
        String content,
        String authorName,
        String authorProfileImage,
        int likeCount,
        int commentCount,
        boolean liked,
        LocalDateTime createdAt
) {
    public static PostDto from(Post p, boolean liked) {
        return new PostDto(p.getId(), p.getTag(), p.getTitle(), p.getContent(),
                p.getUser().getName(), p.getUser().getProfileImage(),
                p.getLikeCount(), p.getCommentCount(), liked, p.getCreatedAt());
    }
}
