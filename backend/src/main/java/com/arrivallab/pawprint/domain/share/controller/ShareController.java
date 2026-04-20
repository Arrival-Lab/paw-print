package com.arrivallab.pawprint.domain.share.controller;

import com.arrivallab.pawprint.domain.share.dto.AcceptResponse;
import com.arrivallab.pawprint.domain.share.dto.InviteResponse;
import com.arrivallab.pawprint.domain.share.dto.ShareMemberResponse;
import com.arrivallab.pawprint.domain.share.service.ShareService;
import com.arrivallab.pawprint.global.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ShareController {

    private final ShareService shareService;

    @PostMapping("/api/pets/{petId}/share/invite")
    public ResponseEntity<ApiResponse<InviteResponse>> invite(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.created(shareService.createInvite(userId, petId));
    }

    @PostMapping("/api/share/accept")
    public ResponseEntity<ApiResponse<AcceptResponse>> accept(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String token) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.ok(shareService.acceptInvite(userId, token));
    }

    @GetMapping("/api/pets/{petId}/share/members")
    public ResponseEntity<ApiResponse<List<ShareMemberResponse>>> getMembers(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId) {
        Long userId = Long.parseLong(userDetails.getUsername());
        return ApiResponse.ok(shareService.getMembers(userId, petId));
    }

    @DeleteMapping("/api/pets/{petId}/share/members/{memberId}")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long petId,
            @PathVariable Long memberId) {
        Long userId = Long.parseLong(userDetails.getUsername());
        shareService.removeMember(userId, petId, memberId);
        return ApiResponse.ok(null);
    }
}
