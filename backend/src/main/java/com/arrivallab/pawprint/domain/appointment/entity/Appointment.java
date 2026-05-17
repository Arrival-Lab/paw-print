package com.arrivallab.pawprint.domain.appointment.entity;

import com.arrivallab.pawprint.domain.pet.entity.Pet;
import com.arrivallab.pawprint.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Appointment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_id", nullable = false)
    private Pet pet;

    /** 예약 시각 (날짜+시간). */
    @Column(name = "appointment_at", nullable = false)
    private LocalDateTime appointmentAt;

    @Column(name = "hospital_name", length = 200)
    private String hospitalName;

    @Column(length = 500)
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "reminder_enabled", nullable = false)
    @Builder.Default
    private Boolean reminderEnabled = true;

    public void update(LocalDateTime appointmentAt, String hospitalName, String reason,
                       String notes, Boolean reminderEnabled) {
        this.appointmentAt = appointmentAt;
        this.hospitalName = hospitalName;
        this.reason = reason;
        this.notes = notes;
        this.reminderEnabled = reminderEnabled;
    }
}
