-- 진료기록 → 진료일정 양방향 링크. 독립 기록은 NULL.
ALTER TABLE medical_records
    ADD COLUMN appointment_id BIGINT;

-- appointment 삭제 시 record 의 appointment_id 만 NULL 로 (기록 자체 보존).
ALTER TABLE medical_records
    ADD CONSTRAINT fk_medical_records_appointment
    FOREIGN KEY (appointment_id) REFERENCES appointments(id)
    ON DELETE SET NULL;

CREATE INDEX idx_medical_records_appointment_id
    ON medical_records(appointment_id);
