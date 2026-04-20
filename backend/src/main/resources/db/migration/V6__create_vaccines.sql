CREATE TABLE vaccines (
    id              BIGSERIAL PRIMARY KEY,
    pet_id          BIGINT       NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    vaccine_name    VARCHAR(100) NOT NULL,
    vaccinated_at   DATE,
    next_vaccine_at DATE,
    notes           TEXT,
    alert_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_vaccines_pet_id   ON vaccines(pet_id);
CREATE INDEX idx_vaccines_next_date ON vaccines(next_vaccine_at) WHERE alert_enabled = TRUE;
