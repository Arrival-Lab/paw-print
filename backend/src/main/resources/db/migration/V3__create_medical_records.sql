CREATE TABLE medical_records (
    id            BIGSERIAL PRIMARY KEY,
    pet_id        BIGINT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    visited_at    DATE   NOT NULL,
    hospital_name VARCHAR(255),
    symptoms      TEXT,
    diagnosis     TEXT,
    treatment     TEXT,
    prescription  TEXT,
    notes         TEXT,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_records_pet_id_visited ON medical_records(pet_id, visited_at DESC);

CREATE TABLE record_attachments (
    id         BIGSERIAL PRIMARY KEY,
    record_id  BIGINT      NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    file_url   TEXT        NOT NULL,
    file_type  VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_record_attachments_record_id ON record_attachments(record_id);

CREATE TABLE ocr_usage (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    year_month VARCHAR(7)  NOT NULL,
    used_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ocr_usage_user_month ON ocr_usage(user_id, year_month);
