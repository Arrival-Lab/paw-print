CREATE TABLE appointments (
    id               BIGSERIAL PRIMARY KEY,
    pet_id           BIGINT       NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    appointment_at   TIMESTAMP    NOT NULL,
    hospital_name    VARCHAR(200),
    reason           VARCHAR(500),
    notes            TEXT,
    reminder_enabled BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appointments_pet_at ON appointments(pet_id, appointment_at);
CREATE INDEX idx_appointments_upcoming ON appointments(appointment_at) WHERE reminder_enabled = TRUE;
