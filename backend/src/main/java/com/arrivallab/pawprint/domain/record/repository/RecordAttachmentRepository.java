package com.arrivallab.pawprint.domain.record.repository;

import com.arrivallab.pawprint.domain.record.entity.MedicalRecord;
import com.arrivallab.pawprint.domain.record.entity.RecordAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecordAttachmentRepository extends JpaRepository<RecordAttachment, Long> {
    long countByRecord(MedicalRecord record);
}
