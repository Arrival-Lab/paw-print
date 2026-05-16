package com.arrivallab.pawprint.domain.diary.dto;

import com.arrivallab.pawprint.domain.diary.entity.DiaryTag;
import com.arrivallab.pawprint.domain.diary.entity.HealthDiary;

import java.time.LocalDate;
import java.util.List;

public record DiarySummaryDto(
        Long id,
        LocalDate diaryDate,
        String content,
        List<String> tags,
        int photoCount,
        String thumbnail
) {
    public static DiarySummaryDto from(HealthDiary diary) {
        return new DiarySummaryDto(
                diary.getId(),
                diary.getDiaryDate(),
                diary.getContent(),
                diary.getTags().stream().map(DiaryTag::getTagName).toList(),
                diary.getPhotos().size(),
                diary.getPhotos().isEmpty() ? null : diary.getPhotos().get(0).getPhotoUrl()
        );
    }
}
