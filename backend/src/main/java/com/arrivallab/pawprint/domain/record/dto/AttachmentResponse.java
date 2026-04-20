package com.arrivallab.pawprint.domain.record.dto;

import com.arrivallab.pawprint.domain.record.entity.FileType;
import com.arrivallab.pawprint.domain.record.entity.RecordAttachment;

import java.time.LocalDateTime;

public record AttachmentResponse(
        Long id,
        String fileUrl,
        FileType fileType,
        LocalDateTime createdAt
) {
    public static AttachmentResponse from(RecordAttachment attachment) {
        return new AttachmentResponse(
                attachment.getId(),
                attachment.getFileUrl(),
                attachment.getFileType(),
                attachment.getCreatedAt()
        );
    }
}
