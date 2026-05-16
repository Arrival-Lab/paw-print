package com.arrivallab.pawprint.domain.vaccine.service;

import com.arrivallab.pawprint.domain.pet.entity.Pet;
import com.arrivallab.pawprint.domain.pet.repository.PetRepository;
import com.arrivallab.pawprint.domain.share.entity.ShareStatus;
import com.arrivallab.pawprint.domain.user.entity.SubscriptionType;
import com.arrivallab.pawprint.domain.vaccine.dto.VaccineRequest;
import com.arrivallab.pawprint.domain.vaccine.dto.VaccineResponse;
import com.arrivallab.pawprint.domain.vaccine.dto.VaccineWithPetDto;
import com.arrivallab.pawprint.domain.vaccine.entity.Vaccine;
import com.arrivallab.pawprint.domain.vaccine.repository.VaccineRepository;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class VaccineService {

    private static final int FREE_ALERT_LIMIT = 2;

    private final VaccineRepository vaccineRepository;
    private final PetRepository petRepository;

    public VaccineResponse create(Long userId, Long petId, VaccineRequest request) {
        Pet pet = getOwnedPet(userId, petId);
        boolean wantsAlert = request.alertEnabled() == null || request.alertEnabled();
        if (wantsAlert && pet.getUser().getSubscriptionType() == SubscriptionType.FREE) {
            long activeAlerts = vaccineRepository.countByPetIdAndAlertEnabledTrue(petId);
            if (activeAlerts >= FREE_ALERT_LIMIT) {
                throw new BusinessException(ErrorCode.VACCINE_ALERT_LIMIT_EXCEEDED);
            }
        }
        Vaccine vaccine = Vaccine.builder()
                .pet(pet)
                .vaccineName(request.vaccineName())
                .vaccinatedAt(request.vaccinatedAt())
                .nextVaccineAt(request.nextVaccineAt())
                .notes(request.notes())
                .alertEnabled(wantsAlert)
                .build();
        return VaccineResponse.from(vaccineRepository.save(vaccine));
    }

    @Transactional(readOnly = true)
    public List<VaccineResponse> getVaccines(Long userId, Long petId) {
        getOwnedPet(userId, petId);
        return vaccineRepository.findByPetIdOrderByNextVaccineAtAsc(petId).stream()
                .map(VaccineResponse::from)
                .toList();
    }

    /** 본인 + 공유받은(ACCEPTED) 모든 펫의 임박 백신 — 탭 배지·홈 위젯용. */
    @Transactional(readOnly = true)
    public List<VaccineWithPetDto> getUpcomingForUser(Long userId, int withinDays) {
        LocalDate today = LocalDate.now();
        LocalDate until = today.plusDays(withinDays);
        return vaccineRepository.findUpcomingByUserId(userId, ShareStatus.ACCEPTED, today, until).stream()
                .map(VaccineWithPetDto::from)
                .toList();
    }

    public VaccineResponse update(Long userId, Long petId, Long vaccineId, VaccineRequest request) {
        Pet pet = getOwnedPet(userId, petId);
        Vaccine vaccine = getVaccineForPet(vaccineId, petId);
        boolean wantsAlert = request.alertEnabled() == null || request.alertEnabled();
        if (wantsAlert && !vaccine.getAlertEnabled()
                && pet.getUser().getSubscriptionType() == SubscriptionType.FREE) {
            long activeAlerts = vaccineRepository.countByPetIdAndAlertEnabledTrue(petId);
            if (activeAlerts >= FREE_ALERT_LIMIT) {
                throw new BusinessException(ErrorCode.VACCINE_ALERT_LIMIT_EXCEEDED);
            }
        }
        vaccine.update(request.vaccineName(), request.vaccinatedAt(), request.nextVaccineAt(),
                request.notes(), wantsAlert);
        return VaccineResponse.from(vaccine);
    }

    public void delete(Long userId, Long petId, Long vaccineId) {
        getOwnedPet(userId, petId);
        vaccineRepository.delete(getVaccineForPet(vaccineId, petId));
    }

    private Pet getOwnedPet(Long userId, Long petId) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PET_NOT_FOUND));
        if (!pet.getUser().getId().equals(userId)) throw new BusinessException(ErrorCode.FORBIDDEN);
        return pet;
    }

    private Vaccine getVaccineForPet(Long vaccineId, Long petId) {
        Vaccine vaccine = vaccineRepository.findById(vaccineId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        if (!vaccine.getPet().getId().equals(petId)) throw new BusinessException(ErrorCode.FORBIDDEN);
        return vaccine;
    }
}
