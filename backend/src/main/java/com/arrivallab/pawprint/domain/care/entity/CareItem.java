package com.arrivallab.pawprint.domain.care.entity;

import com.arrivallab.pawprint.domain.pet.entity.Pet;
import com.arrivallab.pawprint.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "care_items")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class CareItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_id", nullable = false)
    private Pet pet;

    @Column(nullable = false, length = 60)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false, length = 20)
    private CareItemType itemType;

    @Column(name = "target_count", nullable = false)
    @Builder.Default
    private int targetCount = 1;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;

    /** legacy — discontinuedFrom 도입(V21) 후 의미 약화. discontinue() 가 호환을 위해 함께 false 설정. */
    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    /**
     * "오늘부터 사용 안 함" 시점.
     * - null → 항상 활성
     * - discontinuedFrom <= 조회일 → 그 날짜 화면에서 비노출 (과거 날짜는 그대로 보임)
     */
    @Column(name = "discontinued_from")
    private LocalDate discontinuedFrom;

    /** 매일 알림을 보낼 시각. null 이면 알림 없음. */
    @Column(name = "reminder_time")
    private LocalTime reminderTime;

    public void update(String name, CareItemType itemType, int targetCount, int sortOrder, LocalTime reminderTime) {
        this.name = name;
        this.itemType = itemType;
        this.targetCount = Math.max(1, targetCount);
        this.sortOrder = sortOrder;
        this.reminderTime = reminderTime;
    }

    /** 지정된 날짜부터 비활성 — 그 이전 날짜의 체크 기록은 그대로 보존·표시. */
    public void discontinue(LocalDate from) {
        this.discontinuedFrom = from;
        this.active = false; // legacy 호환
    }
}
