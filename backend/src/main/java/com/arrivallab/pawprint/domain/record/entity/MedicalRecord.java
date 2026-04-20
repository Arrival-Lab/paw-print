package com.arrivallab.pawprint.domain.record.entity;

import com.arrivallab.pawprint.domain.pet.entity.Pet;
import com.arrivallab.pawprint.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "medical_records")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class MedicalRecord extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_id", nullable = false)
    private Pet pet;

    @Column(name = "visited_at", nullable = false)
    private LocalDate visitedAt;

    @Column(name = "hospital_name")
    private String hospitalName;

    @Column(columnDefinition = "TEXT")
    private String symptoms;

    @Column(columnDefinition = "TEXT")
    private String diagnosis;

    @Column(columnDefinition = "TEXT")
    private String treatment;

    @Column(columnDefinition = "TEXT")
    private String prescription;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "record", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RecordAttachment> attachments = new ArrayList<>();

    public void update(LocalDate visitedAt, String hospitalName, String symptoms,
                       String diagnosis, String treatment, String prescription, String notes) {
        this.visitedAt = visitedAt;
        this.hospitalName = hospitalName;
        this.symptoms = symptoms;
        this.diagnosis = diagnosis;
        this.treatment = treatment;
        this.prescription = prescription;
        this.notes = notes;
    }
}
