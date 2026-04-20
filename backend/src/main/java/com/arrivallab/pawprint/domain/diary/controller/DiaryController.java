package com.arrivallab.pawprint.domain.diary.controller;

import com.arrivallab.pawprint.domain.diary.dto.*;
import com.arrivallab.pawprint.domain.diary.service.DiaryService;
import com.arrivallab.pawprint.global.response.ApiResponse;
import com.arrivallab.pawprint.global.response.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pets/{petId}/diaries")
@RequiredArgsConstructor
public class DiaryController {

    private final DiaryService diaryService;

    @PostMapping
    public ResponseEntity<ApiResponse<DiaryResponse>> createOrUpdate(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId,
            @RequestBody @Valid DiaryRequest request) {
        DiaryService.UpsertResult result = diaryService.createOrUpdate(uid(userDetails), petId, request);
        return result.created()
                ? ApiResponse.created(result.diary())
                : ApiResponse.ok(result.diary());
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<DiarySummaryDto>>> getDiaries(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(diaryService.getDiaries(uid(userDetails), petId, from, to, page, size));
    }

    @GetMapping("/{diaryId}")
    public ResponseEntity<ApiResponse<DiaryResponse>> getDiary(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId,
            @PathVariable Long diaryId) {
        return ApiResponse.ok(diaryService.getDiary(uid(userDetails), petId, diaryId));
    }

    @PutMapping("/{diaryId}")
    public ResponseEntity<ApiResponse<DiaryResponse>> update(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId,
            @PathVariable Long diaryId,
            @RequestBody @Valid DiaryRequest request) {
        return ApiResponse.ok(diaryService.update(uid(userDetails), petId, diaryId, request));
    }

    @DeleteMapping("/{diaryId}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId,
            @PathVariable Long diaryId) {
        diaryService.delete(uid(userDetails), petId, diaryId);
        return ApiResponse.noContent();
    }

    @PostMapping("/{diaryId}/photos")
    public ResponseEntity<ApiResponse<PhotoResponse>> addPhoto(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId,
            @PathVariable Long diaryId,
            @RequestParam("file") MultipartFile file) {
        return ApiResponse.created(diaryService.addPhoto(uid(userDetails), petId, diaryId, file));
    }

    @DeleteMapping("/{diaryId}/photos/{photoId}")
    public ResponseEntity<ApiResponse<Void>> deletePhoto(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId,
            @PathVariable Long diaryId,
            @PathVariable Long photoId) {
        diaryService.deletePhoto(uid(userDetails), petId, diaryId, photoId);
        return ApiResponse.noContent();
    }

    @GetMapping("/calendar")
    public ResponseEntity<ApiResponse<Map<String, CalendarDayDto>>> getCalendar(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId,
            @RequestParam int year,
            @RequestParam int month) {
        return ApiResponse.ok(diaryService.getCalendar(uid(userDetails), petId, year, month));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<DiarySummaryDto>>> search(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String tags,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        List<String> tagList = (tags != null && !tags.isBlank())
                ? Arrays.asList(tags.split(","))
                : List.of();
        return ApiResponse.ok(diaryService.search(uid(userDetails), petId, keyword, tagList, page, size));
    }

    private Long uid(UserDetails u) {
        return Long.parseLong(u.getUsername());
    }
}
