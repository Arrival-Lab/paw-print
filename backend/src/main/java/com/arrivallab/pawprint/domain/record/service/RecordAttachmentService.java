package com.arrivallab.pawprint.domain.record.service;

import com.arrivallab.pawprint.domain.pet.service.PetAccessGuard;
import com.arrivallab.pawprint.domain.record.dto.AttachmentResponse;
import com.arrivallab.pawprint.domain.record.entity.FileType;
import com.arrivallab.pawprint.domain.record.entity.MedicalRecord;
import com.arrivallab.pawprint.domain.record.entity.RecordAttachment;
import com.arrivallab.pawprint.domain.record.repository.MedicalRecordRepository;
import com.arrivallab.pawprint.domain.record.repository.RecordAttachmentRepository;
import com.arrivallab.pawprint.domain.user.entity.User;
import com.arrivallab.pawprint.domain.user.repository.UserRepository;
import com.arrivallab.pawprint.global.constants.SubscriptionLimits;
import com.arrivallab.pawprint.global.exception.BusinessException;
import com.arrivallab.pawprint.global.exception.ErrorCode;
import com.arrivallab.pawprint.infra.storage.FileDirectory;
import com.arrivallab.pawprint.infra.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * 진료기록 첨부 파일(이미지/PDF) 업로드·삭제 + FREE 등급 사진 갯수 한도 체크.
 * MedicalRecordService 의 CRUD 와 분리해 파일/스토리지 관심사 격리 (SRP).
 */
@Service
@Transactional
@RequiredArgsConstructor
public class RecordAttachmentService {

    private final MedicalRecordRepository recordRepository;
    private final RecordAttachmentRepository attachmentRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final PetAccessGuard petAccessGuard;

    public AttachmentResponse add(Long userId, Long petId, Long recordId, MultipartFile file) {
        petAccessGuard.checkAccess(userId, petId);
        MedicalRecord record = getRecord(petId, recordId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        if (attachmentRepository.countByRecord(record) >= SubscriptionLimits.of(user.getSubscriptionType()).maxPhotosPerItem()) {
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

    public void delete(Long userId, Long petId, Long recordId, Long attachmentId) {
        petAccessGuard.checkAccess(userId, petId);
        RecordAttachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND));
        fileStorageService.delete(attachment.getFileUrl());
        attachmentRepository.delete(attachment);
    }

    private MedicalRecord getRecord(Long petId, Long recordId) {
        MedicalRecord record = recordRepository.findById(recordId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RECORD_NOT_FOUND));
        if (!record.getPet().getId().equals(petId)) throw new BusinessException(ErrorCode.NOT_FOUND);
        return record;
    }
}
