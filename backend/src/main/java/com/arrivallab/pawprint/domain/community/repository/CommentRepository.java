package com.arrivallab.pawprint.domain.community.repository;

import com.arrivallab.pawprint.domain.community.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByPostIdAndIsDeletedFalseOrderByCreatedAtAsc(Long postId);

    /**
     * 댓글 리스트: CommentDto 가 user.nickname / user.profileImage 를 읽으므로
     * @ManyToOne user 를 JOIN FETCH 로 함께 로드 (N+1 회피).
     */
    @Query("SELECT c FROM Comment c JOIN FETCH c.user WHERE c.post.id = :postId AND c.isDeleted = false " +
           "AND c.user.id NOT IN :blockedIds ORDER BY c.createdAt ASC")
    List<Comment> findVisibleByPostId(@Param("postId") Long postId,
                                      @Param("blockedIds") List<Long> blockedIds);
}
