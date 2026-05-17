package com.arrivallab.pawprint.domain.share.dto;

import java.time.LocalDateTime;

/**
 * 공유 초대 응답.
 * - inviteLink: pawprint:// custom scheme. 앱 설치된 기기에서 즉시 동작.
 * - inviteUrl: https://pawprintapp.link/invite/... universal/app link.
 *   카톡 webview 가 fallback HTML 의 JS 통해 custom scheme 호출 → 앱 열림.
 * - inviteCode: 6자리 숫자. 전화·오프라인 공유용. B 가 앱에서 직접 입력해 수락.
 */
public record InviteResponse(
        String inviteLink,
        String inviteUrl,
        String inviteCode,
        LocalDateTime expiresAt
) {}
