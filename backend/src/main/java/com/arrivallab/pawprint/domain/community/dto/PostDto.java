package com.arrivallab.pawprint.domain.community.dto;

import com.arrivallab.pawprint.domain.community.entity.Post;
import com.arrivallab.pawprint.domain.community.entity.PostPhoto;
import com.arrivallab.pawprint.domain.community.entity.PostTag;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;

public record PostDto(
        Long id,
        PostTag tag,
        String title,
        String content,
        Long authorId,
        String authorNickname,
        String authorProfileImage,
        int likeCount,
        int commentCount,
        boolean liked,
        List<PostPhotoDto> photos,
        // KST 시각을 +09:00 offset 포함해 직렬화 → 프론트가 zone-aware 로 파싱 → "9시간 전" 같은 UTC 드리프트 제거.
        OffsetDateTime createdAt
) {
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    public static PostDto from(Post p, boolean liked) {
        return from(p, liked, Collections.emptyList());
    }

    public static PostDto from(Post p, boolean liked, List<PostPhoto> photos) {
        String nickname = p.getUser().getNickname() != null ? p.getUser().getNickname() : "익명";
        List<PostPhotoDto> photoDtos = photos.stream().map(PostPhotoDto::from).toList();
        return new PostDto(p.getId(), p.getTag(), p.getTitle(), p.getContent(),
                p.getUser().getId(), nickname, p.getUser().getProfileImage(),
                p.getLikeCount(), p.getCommentCount(), liked, photoDtos, toKstOffset(p.getCreatedAt()));
    }

    private static OffsetDateTime toKstOffset(LocalDateTime local) {
        return local == null ? null : local.atZone(KST).toOffsetDateTime();
    }
}
