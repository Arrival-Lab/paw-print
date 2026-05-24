package com.arrivallab.pawprint.domain.record.service;

import com.arrivallab.pawprint.domain.appointment.repository.AppointmentRepository;
import com.arrivallab.pawprint.domain.pet.entity.Pet;
import com.arrivallab.pawprint.domain.pet.service.PetAccessGuard;
import com.arrivallab.pawprint.domain.record.dto.*;
import com.arrivallab.pawprint.domain.record.entity.MedicalRecord;
import com.arrivallab.pawprint.domain.record.repository.MedicalRecordRepository;
import com.arrivallab.pawprint.domain.share.entity.ShareStatus;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import com.arrivallab.pawprint.global.response.PageResponse;
import com.arrivallab.pawprint.infra.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * 진료기록 CRUD. 첨부/OCR/병원명추천 등 다른 책임은 각각의 서비스로 분리.
 * - 첨부 업로드/삭제: {@link RecordAttachmentService}
 * - OCR/Audio 파싱: {@link OcrUsageService}
 * - 병원명 autocomplete: {@link HospitalSuggestionService}
 */
@Service
@Transactional
@RequiredArgsConstructor
public class MedicalRecordService {

    // Postgres '(:p IS NULL OR ...)' 파라미터 타입 추론 안티패턴 회피용 sentinel.
    private static final LocalDate DATE_MIN = LocalDate.of(1970, 1, 1);
    private static final LocalDate DATE_MAX = LocalDate.of(2200, 12, 31);

    private final MedicalRecordRepository recordRepository;
    private final AppointmentRepository appointmentRepository;
    private final FileStorageService fileStorageService;
    private final PetAccessGuard petAccessGuard;

    public MedicalRecordResponse create(Long userId, Long petId, MedicalRecordRequest request) {
        Pet pet = petAccessGuard.requireAccess(userId, petId);
        // appointmentId 는 같은 펫의 예약만 허용 — 다른 사용자/펫의 예약 ID 를 가로채 링크하는 IDOR 차단.
        if (request.appointmentId() != null
                && !appointmentRepository.existsByIdAndPet_Id(request.appointmentId(), petId)) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        MedicalRecord record = MedicalRecord.builder()
                .pet(pet)
                .visitedAt(request.visitedAt())
                .hospitalName(request.hospitalName())
                .symptoms(request.symptoms())
                .diagnosis(request.diagnosis())
                .treatment(request.treatment())
                .prescription(request.prescription())
                .notes(request.notes())
                .appointmentId(request.appointmentId())
                .build();
        return MedicalRecordResponse.from(recordRepository.save(record));
    }

    @Transactional(readOnly = true)
    public PageResponse<MedicalRecordSummaryDto> getRecords(Long userId, Long petId,
                                                            int page, int size,
                                                            LocalDate from, LocalDate to) {
        petAccessGuard.checkAccess(userId, petId);
        LocalDate effectiveFrom = from != null ? from : DATE_MIN;
        LocalDate effectiveTo = to != null ? to : DATE_MAX;
        return PageResponse.from(
                recordRepository.findByPetId(petId, effectiveFrom, effectiveTo, PageRequest.of(page, size))
                        .map(MedicalRecordSummaryDto::from)
        );
    }

    /** "전체" 모드 — 본인 + 공유받은(ACCEPTED) 모든 펫 진료기록을 visitedAt 내림차순으로 페이지네이션. */
    @Transactional(readOnly = true)
    public PageResponse<MedicalRecordWithPetDto> getAllRecordsForUser(Long userId, int page, int size) {
        return PageResponse.from(
                recordRepository.findByUserId(userId, ShareStatus.ACCEPTED, PageRequest.of(page, size))
                        .map(MedicalRecordWithPetDto::from)
        );
    }

    @Transactional(readOnly = true)
    public MedicalRecordResponse getRecord(Long userId, Long petId, Long recordId) {
        petAccessGuard.checkAccess(userId, petId);
        return MedicalRecordResponse.from(getRecord(petId, recordId));
    }

    public MedicalRecordResponse update(Long userId, Long petId, Long recordId,
                                        MedicalRecordRequest request) {
        petAccessGuard.checkAccess(userId, petId);
        MedicalRecord record = getRecord(petId, recordId);
        record.update(request.visitedAt(), request.hospitalName(), request.symptoms(),
                request.diagnosis(), request.treatment(), request.prescription(), request.notes());
        return MedicalRecordResponse.from(record);
    }

    public void delete(Long userId, Long petId, Long recordId) {
        petAccessGuard.checkAccess(userId, petId);
        MedicalRecord record = getRecord(petId, recordId);
        record.getAttachments().forEach(a -> fileStorageService.delete(a.getFileUrl()));
        recordRepository.delete(record);
    }

    private MedicalRecord getRecord(Long petId, Long recordId) {
        MedicalRecord record = recordRepository.findById(recordId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RECORD_NOT_FOUND));
        if (!record.getPet().getId().equals(petId)) throw new BusinessException(ErrorCode.NOT_FOUND);
        return record;
    }
}
