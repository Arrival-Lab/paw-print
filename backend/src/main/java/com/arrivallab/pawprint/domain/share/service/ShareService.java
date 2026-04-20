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
import com.arrivallab.pawprint.domain.user.entity.SubscriptionType;
import com.arrivallab.pawprint.domain.user.entity.User;
import com.arrivallab.pawprint.domain.user.repository.UserRepository;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
public class ShareService {

    private static final int FREE_SHARE_LIMIT = 1;

    private final ShareInvitationRepository invitationRepository;
    private final ShareMemberRepository memberRepository;
    private final PetRepository petRepository;
    private final UserRepository userRepository;

    public InviteResponse createInvite(Long userId, Long petId) {
        Pet pet = getOwnedPet(userId, petId);
        if (pet.getUser().getSubscriptionType() == SubscriptionType.FREE) {
            long accepted = memberRepository.countByPetIdAndStatus(petId, ShareStatus.ACCEPTED);
            if (accepted >= FREE_SHARE_LIMIT) throw new BusinessException(ErrorCode.SHARE_LIMIT_EXCEEDED);
        }
        String token = UUID.randomUUID().toString();
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(24);
        invitationRepository.save(ShareInvitation.builder()
                .pet(pet).token(token).expiresAt(expiresAt).build());
        return new InviteResponse("pawprint://share?token=" + token, expiresAt);
    }

    public AcceptResponse acceptInvite(Long userId, String token) {
        ShareInvitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        if (invitation.isExpired()) throw new BusinessException(ErrorCode.INVALID_INPUT);

        Pet pet = invitation.getPet();
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
        getOwnedPet(userId, petId);
        return memberRepository.findByPetIdAndStatus(petId, ShareStatus.ACCEPTED).stream()
                .map(ShareMemberResponse::from)
                .toList();
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
