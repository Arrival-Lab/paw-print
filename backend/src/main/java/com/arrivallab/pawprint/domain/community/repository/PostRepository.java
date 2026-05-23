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
     *
     * '(:tag IS NULL OR ...)' 패턴은 Postgres 가 nullable 파라미터 타입 추론 못해 42P18 던짐.
     * boolean flag 로 분기 + 파라미터 자리에는 항상 non-null 값 (서비스 레이어 책임).
     */
    /**
     * 피드 페이지: PostSummaryDto 가 user.nickname / user.profileImage 를 읽으므로
     * @ManyToOne user 를 JOIN FETCH 로 함께 로드 (N+1 회피).
     * countQuery 는 JOIN FETCH 없는 형태로 분리 — Hibernate 가 fetch 와 count 를 함께 처리 못함.
     */
    @Query(value = "SELECT p FROM Post p JOIN FETCH p.user WHERE p.isDeleted = false " +
                   "AND p.user.id NOT IN :blockedIds " +
                   "AND (:tagFilter = false OR p.tag = :tag) " +
                   "AND (:keywordFilter = false OR p.title LIKE :keywordPattern OR p.content LIKE :keywordPattern) " +
                   "ORDER BY p.createdAt DESC",
           countQuery = "SELECT COUNT(p) FROM Post p WHERE p.isDeleted = false " +
                        "AND p.user.id NOT IN :blockedIds " +
                        "AND (:tagFilter = false OR p.tag = :tag) " +
                        "AND (:keywordFilter = false OR p.title LIKE :keywordPattern OR p.content LIKE :keywordPattern)")
    Page<Post> findAll(@Param("tag") PostTag tag,
                       @Param("tagFilter") boolean tagFilter,
                       @Param("keywordPattern") String keywordPattern,
                       @Param("keywordFilter") boolean keywordFilter,
                       @Param("blockedIds") List<Long> blockedIds,
                       Pageable pageable);
}
