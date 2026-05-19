package com.arrivallab.pawprint.domain.community.dto;

import com.arrivallab.pawprint.domain.community.entity.PostPhoto;

public record PostPhotoDto(Long id, String photoUrl, int sortOrder) {
    public static PostPhotoDto from(PostPhoto photo) {
        return new PostPhotoDto(photo.getId(), photo.getPhotoUrl(), photo.getSortOrder());
    }
}
