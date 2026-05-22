package com.arrivallab.pawprint.domain.user.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 사용자 간 차단 관계. blocker 가 blocked 의 커뮤니티 콘텐츠(게시물·댓글)를 보지 않음.
 * 케어 공유 등 명시적 초대 관계에는 영향 없음.
 */
@Entity
@Table(name = "user_blocks",
    uniqueConstraints = @UniqueConstraint(name = "uk_user_blocks_blocker_blocked",
                                          columnNames = {"blocker_id", "blocked_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class UserBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blocker_id", nullable = false)
    private User blocker;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blocked_id", nullable = false)
    private User blocked;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
