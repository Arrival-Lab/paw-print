package com.arrivallab.pawprint.domain.vaccine.entity;

import com.arrivallab.pawprint.domain.pet.entity.Pet;
import com.arrivallab.pawprint.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "vaccines")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Vaccine extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_id", nullable = false)
    private Pet pet;

    @Column(name = "vaccine_name", nullable = false, length = 100)
    private String vaccineName;

    @Column(name = "vaccinated_at")
    private LocalDate vaccinatedAt;

    @Column(name = "next_vaccine_at")
    private LocalDate nextVaccineAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "alert_enabled", nullable = false)
    @Builder.Default
    private Boolean alertEnabled = true;

    public void update(String vaccineName, LocalDate vaccinatedAt, LocalDate nextVaccineAt,
                       String notes, Boolean alertEnabled) {
        this.vaccineName = vaccineName;
        this.vaccinatedAt = vaccinatedAt;
        this.nextVaccineAt = nextVaccineAt;
        this.notes = notes;
        this.alertEnabled = alertEnabled;
    }
}
