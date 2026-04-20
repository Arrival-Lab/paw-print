package com.arrivallab.pawprint.domain.pet.entity;

import com.arrivallab.pawprint.domain.user.entity.User;
import com.arrivallab.pawprint.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "pets")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class Pet extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private Species species;

    @Column(length = 100)
    private String breed;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Gender gender;

    @Column(name = "is_neutered", nullable = false)
    @Builder.Default
    private Boolean isNeutered = false;

    @Column(name = "profile_image")
    private String profileImage;

    public void update(String name, Species species, String breed, LocalDate birthDate,
                       Gender gender, Boolean isNeutered) {
        this.name = name;
        this.species = species;
        this.breed = breed;
        this.birthDate = birthDate;
        this.gender = gender;
        this.isNeutered = isNeutered;
    }

    public void updateProfileImage(String profileImage) {
        this.profileImage = profileImage;
    }
}
