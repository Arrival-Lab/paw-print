package com.arrivallab.pawprint.domain.diary.controller;

import com.arrivallab.pawprint.domain.diary.dto.CalendarDayDto;
import com.arrivallab.pawprint.domain.diary.service.DiaryService;
import com.arrivallab.pawprint.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** 현재 유저의 모든 펫 다이어리를 한 번에 조회 — 프론트 "전체" 보기용. */
@RestController
@RequestMapping("/api/diaries")
@RequiredArgsConstructor
public class DiaryAggregateController {

    private final DiaryService diaryService;

    @GetMapping("/calendar")
    public ResponseEntity<ApiResponse<Map<String, CalendarDayDto>>> getCalendar(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam int year,
            @RequestParam int month) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.ok(diaryService.getCalendarForUser(userId, year, month));
    }
}
