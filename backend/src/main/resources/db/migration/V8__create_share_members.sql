CREATE TABLE share_members (
    id          BIGSERIAL PRIMARY KEY,
    pet_id      BIGINT      NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    owner_id    BIGINT      NOT NULL REFERENCES users(id),
    member_id   BIGINT      NOT NULL REFERENCES users(id),
    status      VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    invited_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMP,
    UNIQUE (pet_id, member_id)
);

CREATE TABLE share_invitations (
    id         BIGSERIAL PRIMARY KEY,
    pet_id     BIGINT       NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    token      VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP    NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
