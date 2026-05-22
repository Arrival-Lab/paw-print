package com.arrivallab.pawprint.domain.community.repository;

import com.arrivallab.pawprint.domain.community.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByPostIdAndIsDeletedFalseOrderByCreatedAtAsc(Long postId);

    @Query("SELECT c FROM Comment c WHERE c.post.id = :postId AND c.isDeleted = false " +
           "AND c.user.id NOT IN :blockedIds ORDER BY c.createdAt ASC")
    List<Comment> findVisibleByPostId(@Param("postId") Long postId,
                                      @Param("blockedIds") List<Long> blockedIds);
}
