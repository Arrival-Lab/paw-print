package com.arrivallab.pawprint.domain.food.entity;

import com.arrivallab.pawprint.domain.pet.entity.Pet;
import io.hypersistence.utils.hibernate.type.array.StringArrayType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;

@Entity
@Table(name = "food_info")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Builder
@AllArgsConstructor
public class FoodInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_id", nullable = false, unique = true)
    private Pet pet;

    @Column(name = "current_food", columnDefinition = "TEXT")
    private String currentFood;

    @Type(StringArrayType.class)
    @Column(columnDefinition = "text[]")
    @Builder.Default
    private String[] allergies = new String[0];

    @Type(StringArrayType.class)
    @Column(name = "forbidden_foods", columnDefinition = "text[]")
    @Builder.Default
    private String[] forbiddenFoods = new String[0];

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void update(String currentFood, String[] allergies, String[] forbiddenFoods, String notes) {
        this.currentFood = currentFood;
        this.allergies = allergies;
        this.forbiddenFoods = forbiddenFoods;
        this.notes = notes;
    }
}
