package com.arrivallab.pawprint.domain.share.dto;

import com.arrivallab.pawprint.domain.share.entity.ShareMember;

import java.time.LocalDateTime;

public record ShareMemberResponse(Long id, Long memberId, String memberName, String memberProfileImage,
                                   LocalDateTime acceptedAt) {
    public static ShareMemberResponse from(ShareMember m) {
        return new ShareMemberResponse(m.getId(), m.getMember().getId(),
                m.getMember().getName(), m.getMember().getProfileImage(), m.getAcceptedAt());
    }
}
