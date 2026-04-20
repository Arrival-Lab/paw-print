package com.arrivallab.pawprint.domain.diary.dto;

import com.arrivallab.pawprint.domain.diary.entity.DiaryTag;
import com.arrivallab.pawprint.domain.diary.entity.HealthDiary;

import java.time.LocalDate;
import java.util.List;

public record DiaryResponse(
        Long id,
        LocalDate diaryDate,
        String content,
        List<PhotoResponse> photos,
        List<String> tags
) {
    public static DiaryResponse from(HealthDiary diary) {
        return new DiaryResponse(
                diary.getId(),
                diary.getDiaryDate(),
                diary.getContent(),
                diary.getPhotos().stream().map(PhotoResponse::from).toList(),
                diary.getTags().stream().map(DiaryTag::getTagName).toList()
        );
    }
}
