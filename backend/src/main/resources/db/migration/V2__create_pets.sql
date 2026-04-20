CREATE TABLE pets (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name          VARCHAR(100) NOT NULL,
    species       VARCHAR(50)  NOT NULL,
    breed         VARCHAR(100),
    birth_date    DATE,
    gender        VARCHAR(10),
    is_neutered   BOOLEAN      NOT NULL DEFAULT FALSE,
    profile_image TEXT,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pets_user_id ON pets(user_id);
