package com.arrivallab.pawprint.domain.share.dto;

import java.time.LocalDateTime;

/**
 * 공유 초대 응답.
 * - inviteLink: pawprint:// custom scheme. 앱 설치된 기기에서 즉시 동작.
 * - inviteUrl: https://pawprintapp.link/... universal/app link. 앱 미설치 시 웹 fallback 가능.
 * - 프론트는 inviteUrl 우선 공유 (Apple/Google 메시지·메일에서 미리보기 카드 노출), 도메인 미설정 시 inviteLink 만 사용.
 */
public record InviteResponse(
        String inviteLink,
        String inviteUrl,
        LocalDateTime expiresAt
) {}
