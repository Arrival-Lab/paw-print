package com.arrivallab.pawprint.domain.user.controller;

import com.arrivallab.pawprint.domain.user.service.UserBlockService;
import com.arrivallab.pawprint.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/blocks")
@RequiredArgsConstructor
public class UserBlockController {

    private final UserBlockService userBlockService;

    @PostMapping("/{userId}")
    public ResponseEntity<ApiResponse<Void>> block(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long userId) {
        Long me = Long.parseLong(userDetails.getUsername());
        userBlockService.block(me, userId);
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<ApiResponse<Void>> unblock(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long userId) {
        Long me = Long.parseLong(userDetails.getUsername());
        userBlockService.unblock(me, userId);
        return ApiResponse.ok(null);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserBlockService.BlockedUserDto>>> list(
            @AuthenticationPrincipal UserDetails userDetails) {
        Long me = Long.parseLong(userDetails.getUsername());
        return ApiResponse.ok(userBlockService.listBlocked(me));
    }
}
