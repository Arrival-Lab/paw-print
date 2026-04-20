package com.arrivallab.pawprint.domain.diary.repository;

import com.arrivallab.pawprint.domain.diary.entity.DiaryPhoto;
import com.arrivallab.pawprint.domain.diary.entity.HealthDiary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DiaryPhotoRepository extends JpaRepository<DiaryPhoto, Long> {

    long countByDiary(HealthDiary diary);

    @Query("SELECT COALESCE(MAX(p.sortOrder), -1) FROM DiaryPhoto p WHERE p.diary.id = :diaryId")
    int findMaxSortOrderByDiaryId(@Param("diaryId") Long diaryId);
}
