package com.arrivallab.pawprint.domain.diary.dto;

import com.arrivallab.pawprint.domain.diary.entity.HealthDiary;

import java.time.LocalDate;

/** "N년 전 오늘" 회고용 — 펫 정보 포함. */
public record MemoryDiaryDto(
        Long id,
        Long petId,
        String petName,
        LocalDate diaryDate,
        String title,
        String content,
        int photoCount,
        String thumbnail
) {
    public static MemoryDiaryDto from(HealthDiary diary) {
        return new MemoryDiaryDto(
                diary.getId(),
                diary.getPet().getId(),
                diary.getPet().getName(),
                diary.getDiaryDate(),
                diary.getTitle(),
                diary.getContent(),
                diary.getPhotos().size(),
                diary.getPhotos().isEmpty() ? null : diary.getPhotos().get(0).getPhotoUrl()
        );
    }
}
