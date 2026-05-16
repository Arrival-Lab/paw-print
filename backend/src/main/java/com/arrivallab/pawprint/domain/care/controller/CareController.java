package com.arrivallab.pawprint.domain.care.controller;

import com.arrivallab.pawprint.domain.care.dto.*;
import com.arrivallab.pawprint.domain.care.service.CareService;
import com.arrivallab.pawprint.global.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class CareController {

    private final CareService careService;

    // ── 펫 단위 ──────────────────────────────────────────────
    @GetMapping("/api/pets/{petId}/care/items")
    public ResponseEntity<ApiResponse<List<CareItemResponse>>> listItems(
            @AuthenticationPrincipal UserDetails u,
            @PathVariable Long petId) {
        return ApiResponse.ok(careService.listItems(uid(u), petId));
    }

    @PostMapping("/api/pets/{petId}/care/items")
    public ResponseEntity<ApiResponse<CareItemResponse>> createItem(
            @AuthenticationPrincipal UserDetails u,
            @PathVariable Long petId,
            @RequestBody @Valid CareItemRequest req) {
        return ApiResponse.created(careService.createItem(uid(u), petId, req));
    }

    @PutMapping("/api/pets/{petId}/care/items/{itemId}")
    public ResponseEntity<ApiResponse<CareItemResponse>> updateItem(
            @AuthenticationPrincipal UserDetails u,
            @PathVariable Long petId,
            @PathVariable Long itemId,
            @RequestBody @Valid CareItemRequest req) {
        return ApiResponse.ok(careService.updateItem(uid(u), petId, itemId, req));
    }

    @DeleteMapping("/api/pets/{petId}/care/items/{itemId}")
    public ResponseEntity<ApiResponse<Void>> deleteItem(
            @AuthenticationPrincipal UserDetails u,
            @PathVariable Long petId,
            @PathVariable Long itemId) {
        careService.deleteItem(uid(u), petId, itemId);
        return ApiResponse.noContent();
    }

    @GetMapping("/api/pets/{petId}/care/day")
    public ResponseEntity<ApiResponse<List<DailyCareDto>>> getDay(
            @AuthenticationPrincipal UserDetails u,
            @PathVariable Long petId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ApiResponse.ok(careService.getDay(uid(u), petId, date));
    }

    @PutMapping("/api/pets/{petId}/care/items/{itemId}/check")
    public ResponseEntity<ApiResponse<DailyCareDto>> setCheck(
            @AuthenticationPrincipal UserDetails u,
            @PathVariable Long petId,
            @PathVariable Long itemId,
            @RequestBody @Valid CareCheckRequest req) {
        return ApiResponse.ok(careService.setCheck(uid(u), petId, itemId, req));
    }

    // ── 홈 위젯 — 모든 access 가능 펫의 오늘 ─────────────────────
    @GetMapping("/api/care/home")
    public ResponseEntity<ApiResponse<List<HomeCareDto>>> homeToday(
            @AuthenticationPrincipal UserDetails u,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate target = date != null ? date : LocalDate.now();
        return ApiResponse.ok(careService.getHomeToday(uid(u), target));
    }

    private Long uid(UserDetails u) {
        return Long.parseLong(u.getUsername());
    }
}
