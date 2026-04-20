package com.arrivallab.pawprint.domain.pet.repository;

import com.arrivallab.pawprint.domain.pet.entity.Pet;
import com.arrivallab.pawprint.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PetRepository extends JpaRepository<Pet, Long> {
    List<Pet> findByUserOrderByCreatedAtAsc(User user);
    long countByUser(User user);
}
