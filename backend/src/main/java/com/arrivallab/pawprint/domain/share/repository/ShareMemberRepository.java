package com.arrivallab.pawprint.domain.share.repository;

import com.arrivallab.pawprint.domain.share.entity.ShareMember;
import com.arrivallab.pawprint.domain.share.entity.ShareStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShareMemberRepository extends JpaRepository<ShareMember, Long> {
    boolean existsByPetIdAndMemberIdAndStatus(Long petId, Long memberId, ShareStatus status);
}
