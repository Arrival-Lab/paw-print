package com.arrivallab.pawprint.domain.diary.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

public record DiaryRequest(
        @NotNull LocalDate diaryDate,
        @Size(max = 120) String title,
        String content,
        List<String> tags
) {
    public List<String> tags() {
        return tags != null ? tags : List.of();
    }
}
