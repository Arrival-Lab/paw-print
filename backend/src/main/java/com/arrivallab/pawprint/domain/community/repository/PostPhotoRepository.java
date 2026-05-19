package com.arrivallab.pawprint.domain.community.repository;

import com.arrivallab.pawprint.domain.community.entity.Post;
import com.arrivallab.pawprint.domain.community.entity.PostPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostPhotoRepository extends JpaRepository<PostPhoto, Long> {

    long countByPost(Post post);

    List<PostPhoto> findByPostIdOrderBySortOrderAsc(Long postId);

    List<PostPhoto> findByPostIdInOrderBySortOrderAsc(List<Long> postIds);

    @Query("SELECT COALESCE(MAX(p.sortOrder), -1) FROM PostPhoto p WHERE p.post.id = :postId")
    int findMaxSortOrderByPostId(@Param("postId") Long postId);
}
