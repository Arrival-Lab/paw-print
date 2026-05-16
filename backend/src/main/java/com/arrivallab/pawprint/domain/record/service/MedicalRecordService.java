package com.arrivallab.pawprint.domain.record.service;

import com.arrivallab.pawprint.domain.pet.entity.Pet;
import com.arrivallab.pawprint.domain.pet.repository.PetRepository;
import com.arrivallab.pawprint.domain.record.dto.*;
import com.arrivallab.pawprint.domain.record.entity.FileType;
import com.arrivallab.pawprint.domain.record.entity.MedicalRecord;
import com.arrivallab.pawprint.domain.record.entity.RecordAttachment;
import com.arrivallab.pawprint.domain.record.repository.MedicalRecordRepository;
import com.arrivallab.pawprint.domain.record.repository.OcrUsageRepository;
import com.arrivallab.pawprint.domain.record.repository.RecordAttachmentRepository;
import com.arrivallab.pawprint.domain.record.entity.OcrUsage;
import com.arrivallab.pawprint.domain.share.entity.ShareStatus;
import com.arrivallab.pawprint.domain.share.repository.ShareMemberRepository;
import com.arrivallab.pawprint.domain.user.entity.SubscriptionType;
import com.arrivallab.pawprint.domain.user.entity.User;
import com.arrivallab.pawprint.domain.user.repository.UserRepository;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import com.arrivallab.pawprint.global.response.PageResponse;
import com.arrivallab.pawprint.infra.ocr.GeminiOcrService;
import com.arrivallab.pawprint.infra.storage.FileDirectory;
import com.arrivallab.pawprint.infra.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;

@Service
@Transactional
@RequiredArgsConstructor
public class MedicalRecordService {

    private final MedicalRecordRepository recordRepository;
    private final RecordAttachmentRepository attachmentRepository;
    private final OcrUsageRepository ocrUsageRepository;
    private final PetRepository petRepository;
    private final UserRepository userRepository;
    private final ShareMemberRepository shareMemberRepository;
    private final FileStorageService fileStorageService;
    private final GeminiOcrService geminiOcrService;

    public MedicalRecordResponse create(Long userId, Long petId, MedicalRecordRequest request) {
        Pet pet = getOwnedPet(userId, petId);
        MedicalRecord record = MedicalRecord.builder()
                .pet(pet)
                .visitedAt(request.visitedAt())
                .hospitalName(request.hospitalName())
                .symptoms(request.symptoms())
                .diagnosis(request.diagnosis())
                .treatment(request.treatment())
                .prescription(request.prescription())
                .notes(request.notes())
                .build();
        return MedicalRecordResponse.from(recordRepository.save(record));
    }

    @Transactional(readOnly = true)
    public PageResponse<MedicalRecordSummaryDto> getRecords(Long userId, Long petId,
                                                            int page, int size,
                                                            LocalDate from, LocalDate to) {
        checkPetAccess(userId, petId);
        return PageResponse.from(
                recordRepository.findByPetId(petId, from, to, PageRequest.of(page, size))
                        .map(MedicalRecordSummaryDto::from)
        );
    }

    /** "전체" 모드 — 현재 유저의 모든 소유 펫 진료기록을 visitedAt 내림차순으로 페이지네이션. */
    @Transactional(readOnly = true)
    public PageResponse<MedicalRecordWithPetDto> getAllRecordsForUser(Long userId, int page, int size) {
        return PageResponse.from(
                recordRepository.findByUserId(userId, PageRequest.of(page, size))
                        .map(MedicalRecordWithPetDto::from)
        );
    }

    @Transactional(readOnly = true)
    public MedicalRecordResponse getRecord(Long userId, Long petId, Long recordId) {
        checkPetAccess(userId, petId);
        MedicalRecord record = getRecord(petId, recordId);
        return MedicalRecordResponse.from(record);
    }

    public MedicalRecordResponse update(Long userId, Long petId, Long recordId,
                                        MedicalRecordRequest request) {
        getOwnedPet(userId, petId);
        MedicalRecord record = getRecord(petId, recordId);
        record.update(request.visitedAt(), request.hospitalName(), request.symptoms(),
                request.diagnosis(), request.treatment(), request.prescription(), request.notes());
        return MedicalRecordResponse.from(record);
    }

    public void delete(Long userId, Long petId, Long recordId) {
        getOwnedPet(userId, petId);
        MedicalRecord record = getRecord(petId, recordId);
        record.getAttachments().forEach(a -> fileStorageService.delete(a.getFileUrl()));
        recordRepository.delete(record);
    }

    public AttachmentResponse addAttachment(Long userId, Long petId, Long recordId,
                                            MultipartFile file) {
        getOwnedPet(userId, petId);
        MedicalRecord record = getRecord(petId, recordId);

        User user = getUser(userId);
        if (user.getSubscriptionType() == SubscriptionType.FREE
                && attachmentRepository.countByRecord(record) >= 2) {
            throw new BusinessException(ErrorCode.ATTACHMENT_LIMIT_EXCEEDED);
        }

        String contentType = file.getContentType();
        FileType fileType = (contentType != null && contentType.equals("application/pdf"))
                ? FileType.PDF : FileType.IMAGE;

        String url = fileStorageService.upload(file, FileDirectory.RECORD_ATTACHMENT.getPath());

        RecordAttachment attachment = RecordAttachment.builder()
                .record(record)
                .fileUrl(url)
                .fileType(fileType)
                .build();

        return AttachmentResponse.from(attachmentRepository.save(attachment));
    }

    public void deleteAttachment(Long userId, Long petId, Long recordId, Long attachmentId) {
        getOwnedPet(userId, petId);
        RecordAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        fileStorageService.delete(attachment.getFileUrl());
        attachmentRepository.delete(attachment);
    }

    public MedicalRecordOcrResponse parseOcr(Long userId, MultipartFile file) {
        User user = getUser(userId);
        String yearMonth = YearMonth.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));

        if (user.getSubscriptionType() == SubscriptionType.FREE
                && ocrUsageRepository.countByUserAndYearMonth(user, yearMonth) >= 3) {
            throw new BusinessException(ErrorCode.OCR_LIMIT_EXCEEDED);
        }

        MedicalRecordOcrResponse result = geminiOcrService.parseImage(file);

        ocrUsageRepository.save(OcrUsage.builder()
                .user(user)
                .yearMonth(yearMonth)
                .build());

        return result;
    }

    private void checkPetAccess(Long userId, Long petId) {
        petRepository.findById(petId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PET_NOT_FOUND));
        boolean isOwner = petRepository.findById(petId)
                .map(p -> p.getUser().getId().equals(userId))
                .orElse(false);
        boolean isShared = shareMemberRepository
                .existsByPetIdAndMemberIdAndStatus(petId, userId, ShareStatus.ACCEPTED);
        if (!isOwner && !isShared) throw new BusinessException(ErrorCode.FORBIDDEN);
    }

    private Pet getOwnedPet(Long userId, Long petId) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PET_NOT_FOUND));
        if (!pet.getUser().getId().equals(userId)) throw new BusinessException(ErrorCode.FORBIDDEN);
        return pet;
    }

    private MedicalRecord getRecord(Long petId, Long recordId) {
        MedicalRecord record = recordRepository.findById(recordId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RECORD_NOT_FOUND));
        if (!record.getPet().getId().equals(petId)) throw new BusinessException(ErrorCode.NOT_FOUND);
        return record;
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }
}
