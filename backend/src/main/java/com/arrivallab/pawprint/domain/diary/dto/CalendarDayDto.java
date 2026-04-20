package com.arrivallab.pawprint.domain.diary.dto;

import java.util.List;

public record CalendarDayDto(String thumbnail, boolean hasRecord, List<String> tags) {}
