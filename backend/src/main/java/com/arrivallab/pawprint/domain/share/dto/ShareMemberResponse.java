package com.arrivallab.pawprint.domain.share.dto;

import com.arrivallab.pawprint.domain.share.entity.ShareMember;

import java.time.LocalDateTime;

public record ShareMemberResponse(Long id, Long memberId, String memberNickname, String memberProfileImage,
                                   LocalDateTime acceptedAt) {
    public static ShareMemberResponse from(ShareMember m) {
        String nickname = m.getMember().getNickname() != null ? m.getMember().getNickname() : "익명";
        return new ShareMemberResponse(m.getId(), m.getMember().getId(),
                nickname, m.getMember().getProfileImage(), m.getAcceptedAt());
    }
}
