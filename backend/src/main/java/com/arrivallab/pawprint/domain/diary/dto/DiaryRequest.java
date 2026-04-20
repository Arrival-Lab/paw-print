package com.arrivallab.pawprint.domain.diary.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record DiaryRequest(
        @NotNull LocalDate diaryDate,
        String content,
        List<String> tags
) {
    public List<String> tags() {
        return tags != null ? tags : List.of();
    }
}
