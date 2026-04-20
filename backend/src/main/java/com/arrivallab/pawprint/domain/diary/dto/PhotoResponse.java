package com.arrivallab.pawprint.domain.diary.dto;

import com.arrivallab.pawprint.domain.diary.entity.DiaryPhoto;

public record PhotoResponse(Long id, String photoUrl, int sortOrder) {
    public static PhotoResponse from(DiaryPhoto photo) {
        return new PhotoResponse(photo.getId(), photo.getPhotoUrl(), photo.getSortOrder());
    }
}
