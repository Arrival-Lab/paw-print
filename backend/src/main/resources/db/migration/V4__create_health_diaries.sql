CREATE TABLE health_diaries (
    id         BIGSERIAL PRIMARY KEY,
    pet_id     BIGINT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    diary_date DATE   NOT NULL,
    content    TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (pet_id, diary_date)
);
CREATE INDEX idx_diaries_pet_id_date ON health_diaries(pet_id, diary_date DESC);

CREATE TABLE diary_photos (
    id         BIGSERIAL PRIMARY KEY,
    diary_id   BIGINT NOT NULL REFERENCES health_diaries(id) ON DELETE CASCADE,
    photo_url  TEXT   NOT NULL,
    sort_order INT    NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE diary_tags (
    id       BIGSERIAL PRIMARY KEY,
    diary_id BIGINT      NOT NULL REFERENCES health_diaries(id) ON DELETE CASCADE,
    tag_name VARCHAR(50) NOT NULL
);
CREATE INDEX idx_diary_tags_diary_id ON diary_tags(diary_id);
CREATE INDEX idx_diary_tags_name     ON diary_tags(tag_name);
