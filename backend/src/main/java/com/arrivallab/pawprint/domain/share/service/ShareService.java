package com.arrivallab.pawprint.domain.share.service;

import com.arrivallab.pawprint.domain.pet.entity.Pet;
import com.arrivallab.pawprint.domain.pet.repository.PetRepository;
import com.arrivallab.pawprint.domain.share.dto.AcceptResponse;
import com.arrivallab.pawprint.domain.share.dto.InviteResponse;
import com.arrivallab.pawprint.domain.share.dto.ShareMemberResponse;
import com.arrivallab.pawprint.domain.share.entity.ShareInvitation;
import com.arrivallab.pawprint.domain.share.entity.ShareMember;
import com.arrivallab.pawprint.domain.share.entity.ShareStatus;
import com.arrivallab.pawprint.domain.share.repository.ShareInvitationRepository;
import com.arrivallab.pawprint.domain.share.repository.ShareMemberRepository;
import com.arrivallab.pawprint.domain.user.entity.User;
import com.arrivallab.pawprint.domain.user.repository.UserRepository;
import com.arrivallab.pawprint.global.constants.SubscriptionLimits;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class ShareService {

    private final ShareInvitationRepository invitationRepository;
    private final ShareMemberRepository memberRepository;
    private final PetRepository petRepository;
    private final UserRepository userRepository;

    // application.yml 의 share.invite-base-url 로 오버라이드 가능.
    // 운영 시 https://pawprintapp.link 같은 universal-link 가능 도메인 권장.
    @Value("${share.invite-base-url:https://pawprintapp.link}")
    private String inviteBaseUrl;

    private static final SecureRandom RANDOM = new SecureRandom();

    public InviteResponse createInvite(Long userId, Long petId) {
        Pet pet = getOwnedPet(userId, petId);
        long accepted = memberRepository.countByPetIdAndStatus(petId, ShareStatus.ACCEPTED);
        if (accepted >= SubscriptionLimits.of(pet.getUser().getSubscriptionType()).maxShareMembers()) {
            throw new BusinessException(ErrorCode.SHARE_LIMIT_EXCEEDED);
        }
        String token = UUID.randomUUID().toString();
        String inviteCode = generateUniqueInviteCode();
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(24);
        invitationRepository.save(ShareInvitation.builder()
                .pet(pet).token(token).inviteCode(inviteCode).expiresAt(expiresAt).build());
        // /invite/{token} 단일 path — expo-router 동적 라우트(app/invite/[token].tsx)와 매핑.
        // share/* 와 분리해 라우트 충돌 방지.
        String customScheme = "pawprint://invite/" + token;
        String universalUrl = inviteBaseUrl.replaceAll("/$", "") + "/invite/" + token;
        return new InviteResponse(customScheme, universalUrl, inviteCode, expiresAt);
    }

    public AcceptResponse acceptInvite(Long userId, String token) {
        ShareInvitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        return acceptInvitation(userId, invitation);
    }

    /** 6자리 숫자 코드로 수락. */
    public AcceptResponse acceptByCode(Long userId, String code) {
        if (code == null || !code.matches("^\\d{6}$")) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        ShareInvitation invitation = invitationRepository.findActiveByCode(code, LocalDateTime.now())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        return acceptInvitation(userId, invitation);
    }

    /** 6자리 unique 코드 생성. 활성 코드끼리 충돌 검사 — 최대 5회 재시도. */
    private String generateUniqueInviteCode() {
        LocalDateTime now = LocalDateTime.now();
        for (int i = 0; i < 5; i++) {
            String code = String.format("%06d", RANDOM.nextInt(1_000_000));
            if (!invitationRepository.existsActiveByCode(code, now)) return code;
        }
        // 매우 드문 경우 (1M 코드 중 5번 연속 충돌). 그래도 fallback.
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    private AcceptResponse acceptInvitation(Long userId, ShareInvitation invitation) {
        if (invitation.isExpired()) throw new BusinessException(ErrorCode.INVALID_INPUT);

        Pet pet = invitation.getPet();
        // 자기 자신의 펫 초대를 본인이 수락하는 케이스 차단 (초대 코드를 본인이 알게 되어 잘못 입력하는 등).
        if (pet.getUser().getId().equals(userId)) throw new BusinessException(ErrorCode.INVALID_INPUT);

        User member = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        boolean alreadyMember = memberRepository.findByPetIdAndMemberId(pet.getId(), userId).isPresent();
        if (alreadyMember) throw new BusinessException(ErrorCode.INVALID_INPUT);

        ShareMember shareMember = ShareMember.builder()
                .pet(pet).owner(pet.getUser()).member(member).build();
        shareMember.accept();
        memberRepository.save(shareMember);
        invitationRepository.delete(invitation);

        return new AcceptResponse(pet.getId(), pet.getName());
    }

    @Transactional(readOnly = true)
    public List<ShareMemberResponse> getMembers(Long userId, Long petId) {
        // 소유자 + ACCEPTED 멤버 모두 멤버 목록 read 가능. 추가/제거는 소유자만(removeMember/createInvite).
        getPetWithAccess(userId, petId);
        return memberRepository.findByPetIdAndStatus(petId, ShareStatus.ACCEPTED).stream()
                .map(ShareMemberResponse::from)
                .toList();
    }

    private Pet getPetWithAccess(Long userId, Long petId) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PET_NOT_FOUND));
        boolean isOwner = pet.getUser().getId().equals(userId);
        boolean isShared = memberRepository
                .existsByPetIdAndMemberIdAndStatus(petId, userId, ShareStatus.ACCEPTED);
        if (!isOwner && !isShared) throw new BusinessException(ErrorCode.FORBIDDEN);
        return pet;
    }

    public void removeMember(Long userId, Long petId, Long memberId) {
        getOwnedPet(userId, petId);
        ShareMember member = memberRepository.findByPetIdAndMemberId(petId, memberId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        memberRepository.delete(member);
    }

    private Pet getOwnedPet(Long userId, Long petId) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PET_NOT_FOUND));
        if (!pet.getUser().getId().equals(userId)) throw new BusinessException(ErrorCode.FORBIDDEN);
        return pet;
    }
}
