package com.arrivallab.pawprint.domain.diary.service;

import com.arrivallab.pawprint.domain.diary.dto.MetricPointDto;
import com.arrivallab.pawprint.domain.diary.dto.MetricRequest;
import com.arrivallab.pawprint.domain.diary.dto.MetricResponse;
import com.arrivallab.pawprint.domain.diary.entity.HealthMetric;
import com.arrivallab.pawprint.domain.diary.entity.MetricType;
import com.arrivallab.pawprint.domain.diary.repository.HealthMetricRepository;
import com.arrivallab.pawprint.domain.pet.entity.Pet;
import com.arrivallab.pawprint.domain.pet.repository.PetRepository;
import com.arrivallab.pawprint.domain.share.entity.ShareStatus;
import com.arrivallab.pawprint.domain.share.repository.ShareMemberRepository;
import com.arrivallab.pawprint.domain.user.entity.SubscriptionType;
import com.arrivallab.pawprint.domain.user.entity.User;
import com.arrivallab.pawprint.domain.user.repository.UserRepository;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import com.arrivallab.pawprint.global.response.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class MetricService {

    private final HealthMetricRepository metricRepository;
    private final PetRepository petRepository;
    private final UserRepository userRepository;
    private final ShareMemberRepository shareMemberRepository;

    public MetricResponse create(Long userId, Long petId, MetricRequest request) {
        Pet pet = getPetWithAccess(userId, petId);
        HealthMetric metric = HealthMetric.builder()
                .pet(pet)
                .metricType(request.metricType())
                .metricName(request.metricType() == MetricType.CUSTOM ? request.metricName() : null)
                .value(request.value())
                .unit(request.unit())
                .measuredAt(request.measuredAt())
                .build();
        return MetricResponse.from(metricRepository.save(metric));
    }

    @Transactional(readOnly = true)
    public PageResponse<MetricResponse> getMetrics(Long userId, Long petId, MetricType type, int page, int size) {
        getPetWithAccess(userId, petId);
        return PageResponse.from(
                metricRepository.findByPetId(petId, type, PageRequest.of(page, size))
                        .map(MetricResponse::from)
        );
    }

    @Transactional(readOnly = true)
    public List<MetricPointDto> getChartData(Long userId, Long petId, MetricType type,
                                              LocalDate from, LocalDate to) {
        getPetWithAccess(userId, petId);
        User user = getUser(userId);
        LocalDate today = LocalDate.now();

        if (user.getSubscriptionType() == SubscriptionType.FREE) {
            LocalDate freeLimit = today.minusDays(30);
            if (from == null || from.isBefore(freeLimit)) from = freeLimit;
        }
        if (from == null) from = today.minusDays(365);
        if (to == null) to = today;

        return metricRepository.findForChart(petId, type, from, to).stream()
                .map(m -> new MetricPointDto(m.getMeasuredAt(), m.getValue()))
                .toList();
    }

    public void delete(Long userId, Long petId, Long metricId) {
        getPetWithAccess(userId, petId);
        HealthMetric metric = metricRepository.findById(metricId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        if (!metric.getPet().getId().equals(petId)) throw new BusinessException(ErrorCode.FORBIDDEN);
        metricRepository.delete(metric);
    }

    /** 소유자 + ACCEPTED 멤버 모두 통과 — 양방향 공유 모델. */
    private Pet getPetWithAccess(Long userId, Long petId) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PET_NOT_FOUND));
        boolean isOwner = pet.getUser().getId().equals(userId);
        boolean isShared = shareMemberRepository
                .existsByPetIdAndMemberIdAndStatus(petId, userId, ShareStatus.ACCEPTED);
        if (!isOwner && !isShared) throw new BusinessException(ErrorCode.FORBIDDEN);
        return pet;
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }
}
