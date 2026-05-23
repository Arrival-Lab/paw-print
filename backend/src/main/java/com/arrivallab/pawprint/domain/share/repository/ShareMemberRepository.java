package com.arrivallab.pawprint.domain.share.repository;

import com.arrivallab.pawprint.domain.share.entity.ShareMember;
import com.arrivallab.pawprint.domain.share.entity.ShareStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ShareMemberRepository extends JpaRepository<ShareMember, Long> {
    boolean existsByPetIdAndMemberIdAndStatus(Long petId, Long memberId, ShareStatus status);
    long countByPetIdAndStatus(Long petId, ShareStatus status);
    List<ShareMember> findByPetIdAndStatus(Long petId, ShareStatus status);
    Optional<ShareMember> findByPetIdAndMemberId(Long petId, Long memberId);

    /**
     * 특정 멤버에게 공유된 펫 조회 — CareService.getAccessiblePets 등 사용자별 접근 가능 펫 모을 때.
     * JOIN FETCH 로 ShareMember.pet 까지 한 번에 로드해 나중에 sm.getPet() 접근 시 N+1 회피.
     */
    @Query("SELECT sm FROM ShareMember sm JOIN FETCH sm.pet " +
           "WHERE sm.member.id = :memberId AND sm.status = :status")
    List<ShareMember> findByMemberIdAndStatus(@Param("memberId") Long memberId,
                                              @Param("status") ShareStatus status);
}
