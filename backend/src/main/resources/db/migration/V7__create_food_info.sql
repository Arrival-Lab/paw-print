CREATE TABLE food_info (
    id              BIGSERIAL PRIMARY KEY,
    pet_id          BIGINT NOT NULL REFERENCES pets(id) ON DELETE CASCADE UNIQUE,
    current_food    TEXT,
    allergies       TEXT[] DEFAULT '{}',
    forbidden_foods TEXT[] DEFAULT '{}',
    notes           TEXT,
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
