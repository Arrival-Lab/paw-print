package com.arrivallab.pawprint.domain.share.repository;

import com.arrivallab.pawprint.domain.share.entity.ShareMember;
import com.arrivallab.pawprint.domain.share.entity.ShareStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShareMemberRepository extends JpaRepository<ShareMember, Long> {
    boolean existsByPetIdAndMemberIdAndStatus(Long petId, Long memberId, ShareStatus status);
    long countByPetIdAndStatus(Long petId, ShareStatus status);
    List<ShareMember> findByPetIdAndStatus(Long petId, ShareStatus status);
    Optional<ShareMember> findByPetIdAndMemberId(Long petId, Long memberId);
}
