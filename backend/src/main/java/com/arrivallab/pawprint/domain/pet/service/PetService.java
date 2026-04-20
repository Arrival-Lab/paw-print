package com.arrivallab.pawprint.domain.pet.service;

import com.arrivallab.pawprint.domain.pet.dto.PetRequest;
import com.arrivallab.pawprint.domain.pet.dto.PetResponse;
import com.arrivallab.pawprint.domain.pet.entity.Pet;
import com.arrivallab.pawprint.domain.pet.repository.PetRepository;
import com.arrivallab.pawprint.domain.share.entity.ShareStatus;
import com.arrivallab.pawprint.domain.share.repository.ShareMemberRepository;
import com.arrivallab.pawprint.domain.user.entity.SubscriptionType;
import com.arrivallab.pawprint.domain.user.entity.User;
import com.arrivallab.pawprint.domain.user.repository.UserRepository;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import com.arrivallab.pawprint.infra.storage.FileDirectory;
import com.arrivallab.pawprint.infra.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class PetService {

    private final PetRepository petRepository;
    private final UserRepository userRepository;
    private final ShareMemberRepository shareMemberRepository;
    private final FileStorageService fileStorageService;

    public PetResponse create(Long userId, PetRequest request) {
        User user = getUser(userId);

        if (user.getSubscriptionType() == SubscriptionType.FREE
                && petRepository.countByUser(user) >= 3) {
            throw new BusinessException(ErrorCode.PET_LIMIT_EXCEEDED);
        }

        Pet pet = Pet.builder()
                .user(user)
                .name(request.name())
                .species(request.species())
                .breed(request.breed())
                .birthDate(request.birthDate())
                .gender(request.gender())
                .isNeutered(request.isNeutered())
                .build();

        return PetResponse.from(petRepository.save(pet));
    }

    @Transactional(readOnly = true)
    public List<PetResponse> getMyPets(Long userId) {
        User user = getUser(userId);
        return petRepository.findByUserOrderByCreatedAtAsc(user).stream()
                .map(PetResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public PetResponse getPet(Long userId, Long petId) {
        Pet pet = getPetWithAccessCheck(userId, petId);
        return PetResponse.from(pet);
    }

    public PetResponse update(Long userId, Long petId, PetRequest request) {
        Pet pet = getOwnedPet(userId, petId);
        pet.update(request.name(), request.species(), request.breed(),
                request.birthDate(), request.gender(), request.isNeutered());
        return PetResponse.from(pet);
    }

    public void delete(Long userId, Long petId) {
        Pet pet = getOwnedPet(userId, petId);
        petRepository.delete(pet);
    }

    public String uploadProfileImage(Long userId, Long petId, MultipartFile file) {
        Pet pet = getOwnedPet(userId, petId);

        if (pet.getProfileImage() != null) {
            fileStorageService.delete(pet.getProfileImage());
        }

        String url = fileStorageService.upload(file, FileDirectory.PET_PROFILE.getPath());
        pet.updateProfileImage(url);
        return url;
    }

    private Pet getPetWithAccessCheck(Long userId, Long petId) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PET_NOT_FOUND));

        boolean isOwner = pet.getUser().getId().equals(userId);
        boolean isSharedMember = shareMemberRepository
                .existsByPetIdAndMemberIdAndStatus(petId, userId, ShareStatus.ACCEPTED);

        if (!isOwner && !isSharedMember) throw new BusinessException(ErrorCode.FORBIDDEN);
        return pet;
    }

    private Pet getOwnedPet(Long userId, Long petId) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PET_NOT_FOUND));
        if (!pet.getUser().getId().equals(userId)) throw new BusinessException(ErrorCode.FORBIDDEN);
        return pet;
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }
}
