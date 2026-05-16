package com.arrivallab.pawprint.domain.pet.repository;

import com.arrivallab.pawprint.domain.pet.entity.Pet;
import com.arrivallab.pawprint.domain.share.entity.ShareStatus;
import com.arrivallab.pawprint.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PetRepository extends JpaRepository<Pet, Long> {
    List<Pet> findByUserOrderByCreatedAtAsc(User user);
    long countByUser(User user);

    /** 현재 유저가 볼 수 있는 모든 펫 — 본인 소유 + 공유 ACCEPTED. createdAt 오름차순. */
    @Query("SELECT p FROM Pet p WHERE p.user.id = :userId " +
           "   OR p.id IN (SELECT sm.pet.id FROM ShareMember sm " +
           "               WHERE sm.member.id = :userId AND sm.status = :status) " +
           "ORDER BY p.createdAt ASC")
    List<Pet> findVisibleToUser(@Param("userId") Long userId,
                                @Param("status") ShareStatus status);
}
