-- 케어 체크리스트: 펫별 반복 항목 + 일별 체크 기록
CREATE TABLE care_items (
    id BIGSERIAL PRIMARY KEY,
    pet_id BIGINT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    name VARCHAR(60) NOT NULL,
    item_type VARCHAR(20) NOT NULL,
    target_count INT NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_care_items_pet_active ON care_items(pet_id, active);

CREATE TABLE care_checks (
    id BIGSERIAL PRIMARY KEY,
    care_item_id BIGINT NOT NULL REFERENCES care_items(id) ON DELETE CASCADE,
    checked_at DATE NOT NULL,
    count INT NOT NULL DEFAULT 1,
    note TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_care_checks_item_date ON care_checks(care_item_id, checked_at);
CREATE INDEX idx_care_checks_date ON care_checks(checked_at);
