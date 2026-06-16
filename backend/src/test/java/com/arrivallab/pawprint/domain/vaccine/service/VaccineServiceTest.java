package com.arrivallab.pawprint.domain.vaccine.service;

import com.arrivallab.pawprint.domain.pet.entity.Pet;
import com.arrivallab.pawprint.domain.pet.repository.PetRepository;
import com.arrivallab.pawprint.domain.share.repository.ShareMemberRepository;
import com.arrivallab.pawprint.domain.user.entity.SubscriptionType;
import com.arrivallab.pawprint.domain.user.entity.User;
import com.arrivallab.pawprint.domain.vaccine.dto.VaccineRequest;
import com.arrivallab.pawprint.domain.vaccine.entity.RecurrenceType;
import com.arrivallab.pawprint.domain.vaccine.entity.Vaccine;
import com.arrivallab.pawprint.domain.vaccine.entity.VaccineCategory;
import com.arrivallab.pawprint.domain.vaccine.repository.VaccineRepository;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 백신 알림 한도(maxVaccineAlerts) 게이팅 동작을 고정.
 * create/update 의 비대칭(update 는 OFF→ON 일 때만 한도 검사)이 "우회"가 아니라
 * "이미 카운트된 알림의 거짓 거부를 막는 올바른 설계"임을 잠근다.
 * FREE 티어 maxVaccineAlerts = 3.
 */
@ExtendWith(MockitoExtension.class)
class VaccineServiceTest {

    private static final long USER = 1L;
    private static final long PET = 10L;
    private static final long VACCINE = 100L;
    private static final LocalDate DATE = LocalDate.of(2026, 1, 1);

    @Mock private VaccineRepository vaccineRepository;
    @Mock private PetRepository petRepository;
    @Mock private ShareMemberRepository shareMemberRepository;
    @InjectMocks private VaccineService service;

    private Pet freePet() {
        User owner = User.builder().id(USER).subscriptionType(SubscriptionType.FREE).build();
        return Pet.builder().id(PET).user(owner).build();
    }

    private VaccineRequest request(Boolean alertEnabled) {
        return new VaccineRequest("광견병", DATE, null, null, alertEnabled, RecurrenceType.NONE, VaccineCategory.VACCINE);
    }

    private Vaccine vaccineWithAlert(boolean alertEnabled) {
        return Vaccine.builder()
                .pet(freePet())
                .vaccineName("광견병")
                .vaccinatedAt(DATE)
                .alertEnabled(alertEnabled)
                .recurrenceType(RecurrenceType.NONE)
                .category(VaccineCategory.VACCINE)
                .build();
    }

    // ── create ──────────────────────────────────────────────

    @Test
    @DisplayName("create: 알림 켜진 백신이 이미 한도(3)면 새 알림 백신 생성을 거부한다")
    void create_atLimit_rejected() {
        when(petRepository.findById(PET)).thenReturn(Optional.of(freePet()));
        when(vaccineRepository.countByPetIdAndAlertEnabledTrue(PET)).thenReturn(3L);

        BusinessException ex = catchThrowableOfType(
                () -> service.create(USER, PET, request(true)), BusinessException.class);

        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.VACCINE_ALERT_LIMIT_EXCEEDED);
    }

    @Test
    @DisplayName("create: 한도 미만이면 알림 백신 생성을 허용한다")
    void create_belowLimit_allowed() {
        when(petRepository.findById(PET)).thenReturn(Optional.of(freePet()));
        when(vaccineRepository.countByPetIdAndAlertEnabledTrue(PET)).thenReturn(2L);
        when(vaccineRepository.save(any(Vaccine.class))).thenAnswer(inv -> inv.getArgument(0));

        assertThatCode(() -> service.create(USER, PET, request(true))).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("create: 알림을 끈(alertEnabled=false) 백신은 한도와 무관하게 허용 — 카운트 쿼리조차 안 함")
    void create_alertDisabled_skipsLimitCheck() {
        when(petRepository.findById(PET)).thenReturn(Optional.of(freePet()));
        when(vaccineRepository.save(any(Vaccine.class))).thenAnswer(inv -> inv.getArgument(0));

        assertThatCode(() -> service.create(USER, PET, request(false))).doesNotThrowAnyException();
        verify(vaccineRepository, never()).countByPetIdAndAlertEnabledTrue(anyLong());
    }

    // ── update (비대칭의 핵심) ────────────────────────────────

    @Test
    @DisplayName("update: 이미 알림 켜진 백신은 한도(3)에 도달했어도 재저장 허용 — 한도 재검사를 하지 않는다(거짓 거부 방지)")
    void update_alreadyEnabled_atLimit_allowedWithoutRecheck() {
        when(petRepository.findById(PET)).thenReturn(Optional.of(freePet()));
        when(vaccineRepository.findById(VACCINE)).thenReturn(Optional.of(vaccineWithAlert(true)));

        assertThatCode(() -> service.update(USER, PET, VACCINE, request(true))).doesNotThrowAnyException();
        verify(vaccineRepository, never()).countByPetIdAndAlertEnabledTrue(anyLong());
    }

    @Test
    @DisplayName("update: 꺼져있던 알림을 켜려 할 때(OFF→ON) 한도(3)면 거부한다 — 우회 불가")
    void update_offToOn_atLimit_rejected() {
        when(petRepository.findById(PET)).thenReturn(Optional.of(freePet()));
        when(vaccineRepository.findById(VACCINE)).thenReturn(Optional.of(vaccineWithAlert(false)));
        when(vaccineRepository.countByPetIdAndAlertEnabledTrue(PET)).thenReturn(3L);

        BusinessException ex = catchThrowableOfType(
                () -> service.update(USER, PET, VACCINE, request(true)), BusinessException.class);

        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.VACCINE_ALERT_LIMIT_EXCEEDED);
    }
}
