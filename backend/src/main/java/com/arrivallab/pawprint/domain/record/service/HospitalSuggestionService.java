package com.arrivallab.pawprint.domain.record.service;

import com.arrivallab.pawprint.domain.appointment.repository.AppointmentRepository;
import com.arrivallab.pawprint.domain.pet.service.PetAccessGuard;
import com.arrivallab.pawprint.domain.record.repository.MedicalRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * 진료기록·진료일정에 입력된 distinct 병원명 union — autocomplete 추천용.
 * MedicalRecordRepository + AppointmentRepository 두 출처 모두 조회.
 * LinkedHashSet 으로 중복 제거하며 record→appointment 순서 유지.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class HospitalSuggestionService {

    private final MedicalRecordRepository recordRepository;
    private final AppointmentRepository appointmentRepository;
    private final PetAccessGuard petAccessGuard;

    public List<String> suggestForPet(Long userId, Long petId) {
        petAccessGuard.checkAccess(userId, petId);
        Set<String> merged = new LinkedHashSet<>();
        merged.addAll(recordRepository.findDistinctHospitalNamesByPetId(petId));
        merged.addAll(appointmentRepository.findDistinctHospitalNamesByPetId(petId));
        return new ArrayList<>(merged);
    }
}
