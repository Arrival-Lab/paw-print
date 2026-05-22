package com.arrivallab.pawprint.domain.community.repository;

import com.arrivallab.pawprint.domain.community.entity.Post;
import com.arrivallab.pawprint.domain.community.entity.PostTag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {

    /**
     * 빈 IN 절은 PostgreSQL 에서 syntax error 라서 sentinel(-1L) 을 채워 보호 — CommunityService 에서 처리.
     */
    @Query("SELECT p FROM Post p WHERE p.isDeleted = false " +
           "AND p.user.id NOT IN :blockedIds " +
           "AND (:tag IS NULL OR p.tag = :tag) " +
           "AND (:keyword IS NULL OR p.title LIKE %:keyword% OR p.content LIKE %:keyword%) " +
           "ORDER BY p.createdAt DESC")
    Page<Post> findAll(@Param("tag") PostTag tag,
                       @Param("keyword") String keyword,
                       @Param("blockedIds") List<Long> blockedIds,
                       Pageable pageable);
}
