CREATE TABLE users (
    id               BIGSERIAL PRIMARY KEY,
    email            VARCHAR(100) NOT NULL UNIQUE,
    password         VARCHAR(255),
    name             VARCHAR(50)  NOT NULL,
    profile_image    TEXT,
    subscription_type VARCHAR(10) NOT NULL DEFAULT 'FREE',
    social_provider  VARCHAR(20),
    social_id        VARCHAR(255),
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
