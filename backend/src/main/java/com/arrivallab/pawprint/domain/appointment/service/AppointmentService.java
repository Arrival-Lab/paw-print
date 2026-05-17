package com.arrivallab.pawprint.domain.appointment.service;

import com.arrivallab.pawprint.domain.appointment.dto.AppointmentRequest;
import com.arrivallab.pawprint.domain.appointment.dto.AppointmentResponse;
import com.arrivallab.pawprint.domain.appointment.dto.AppointmentWithPetDto;
import com.arrivallab.pawprint.domain.appointment.entity.Appointment;
import com.arrivallab.pawprint.domain.appointment.repository.AppointmentRepository;
import com.arrivallab.pawprint.domain.pet.entity.Pet;
import com.arrivallab.pawprint.domain.pet.repository.PetRepository;
import com.arrivallab.pawprint.domain.share.entity.ShareStatus;
import com.arrivallab.pawprint.domain.share.repository.ShareMemberRepository;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final PetRepository petRepository;
    private final ShareMemberRepository shareMemberRepository;

    public AppointmentResponse create(Long userId, Long petId, AppointmentRequest request) {
        Pet pet = getPetWithAccess(userId, petId);
        Appointment a = Appointment.builder()
                .pet(pet)
                .appointmentAt(request.appointmentAt())
                .hospitalName(request.hospitalName())
                .reason(request.reason())
                .notes(request.notes())
                .reminderEnabled(request.reminderEnabled() == null ? true : request.reminderEnabled())
                .build();
        return AppointmentResponse.from(appointmentRepository.save(a));
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getAll(Long userId, Long petId) {
        getPetWithAccess(userId, petId);
        return appointmentRepository.findByPet_IdOrderByAppointmentAtAsc(petId).stream()
                .map(AppointmentResponse::from)
                .toList();
    }

    /** 다이어리 캘린더 마커용 — 특정 월의 예약. */
    @Transactional(readOnly = true)
    public List<AppointmentResponse> getMonth(Long userId, Long petId, int year, int month) {
        getPetWithAccess(userId, petId);
        LocalDateTime from = LocalDate.of(year, month, 1).atStartOfDay();
        LocalDateTime to = from.plusMonths(1);
        return appointmentRepository.findByPetAndRange(petId, from, to).stream()
                .map(AppointmentResponse::from)
                .toList();
    }

    /** 홈 "다가오는 예약" — 본인+공유 펫 전부, withinDays 일 이내. */
    @Transactional(readOnly = true)
    public List<AppointmentWithPetDto> getUpcomingForUser(Long userId, int withinDays) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime until = now.plusDays(withinDays);
        return appointmentRepository.findUpcomingByUserId(userId, ShareStatus.ACCEPTED, now, until).stream()
                .map(AppointmentWithPetDto::from)
                .toList();
    }

    public AppointmentResponse update(Long userId, Long petId, Long appointmentId,
                                       AppointmentRequest request) {
        getPetWithAccess(userId, petId);
        Appointment a = getOwnedAppointment(petId, appointmentId);
        a.update(request.appointmentAt(), request.hospitalName(), request.reason(),
                request.notes(), request.reminderEnabled() == null ? true : request.reminderEnabled());
        return AppointmentResponse.from(a);
    }

    public void delete(Long userId, Long petId, Long appointmentId) {
        getPetWithAccess(userId, petId);
        Appointment a = getOwnedAppointment(petId, appointmentId);
        appointmentRepository.delete(a);
    }

    /** 소유자 + ACCEPTED 멤버 통과 — 양방향 공유. */
    private Pet getPetWithAccess(Long userId, Long petId) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PET_NOT_FOUND));
        boolean isOwner = pet.getUser().getId().equals(userId);
        boolean isShared = shareMemberRepository
                .existsByPetIdAndMemberIdAndStatus(petId, userId, ShareStatus.ACCEPTED);
        if (!isOwner && !isShared) throw new BusinessException(ErrorCode.FORBIDDEN);
        return pet;
    }

    private Appointment getOwnedAppointment(Long petId, Long appointmentId) {
        Appointment a = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        if (!a.getPet().getId().equals(petId)) throw new BusinessException(ErrorCode.FORBIDDEN);
        return a;
    }
}
