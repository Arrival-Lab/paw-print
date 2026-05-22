-- AI 증상 체크 월별 사용량 — OCR과 동일한 패턴.
CREATE TABLE symptom_check_usages (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    year_month VARCHAR(7)  NOT NULL,
    used_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_symptom_check_user_month ON symptom_check_usages(user_id, year_month);
