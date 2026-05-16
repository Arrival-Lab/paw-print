package com.arrivallab.pawprint.domain.care.entity;

import com.arrivallab.pawprint.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(
        name = "care_checks",
        uniqueConstraints = @UniqueConstraint(name = "uq_care_checks_item_date", columnNames = {"care_item_id", "checked_at"})
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class CareCheck extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "care_item_id", nullable = false)
    private CareItem careItem;

    @Column(name = "checked_at", nullable = false)
    private LocalDate checkedAt;

    @Column(nullable = false)
    @Builder.Default
    private int count = 1;

    @Column(columnDefinition = "TEXT")
    private String note;

    public void setCount(int count) {
        this.count = Math.max(0, count);
    }

    public void setNote(String note) {
        this.note = note;
    }
}
