package com.arrivallab.pawprint.domain.diary.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "diary_tags")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class DiaryTag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diary_id", nullable = false)
    private HealthDiary diary;

    @Column(name = "tag_name", nullable = false, length = 50)
    private String tagName;
}
