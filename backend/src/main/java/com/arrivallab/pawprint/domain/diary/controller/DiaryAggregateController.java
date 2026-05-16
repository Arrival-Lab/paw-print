package com.arrivallab.pawprint.domain.diary.controller;

import com.arrivallab.pawprint.domain.diary.dto.CalendarDayDto;
import com.arrivallab.pawprint.domain.diary.dto.MemoryDiaryDto;
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

import java.util.List;
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

    /** "N년 전 오늘" 회고 — 본인+공유 펫의 같은 월/일, 오늘 이전 다이어리. */
    @GetMapping("/memories")
    public ResponseEntity<ApiResponse<List<MemoryDiaryDto>>> getMemories(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.ok(diaryService.getMemories(userId));
    }
}
