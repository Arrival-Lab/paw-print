package com.arrivallab.pawprint.domain.community.repository;

import com.arrivallab.pawprint.domain.community.entity.Post;
import com.arrivallab.pawprint.domain.community.entity.PostTag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepository extends JpaRepository<Post, Long> {

    @Query("SELECT p FROM Post p WHERE p.isDeleted = false " +
           "AND (:tag IS NULL OR p.tag = :tag) " +
           "AND (:keyword IS NULL OR p.title LIKE %:keyword% OR p.content LIKE %:keyword%) " +
           "ORDER BY p.createdAt DESC")
    Page<Post> findAll(@Param("tag") PostTag tag,
                       @Param("keyword") String keyword,
                       Pageable pageable);
}
