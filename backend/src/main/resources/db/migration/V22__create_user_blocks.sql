CREATE TABLE user_blocks (
    id         BIGSERIAL PRIMARY KEY,
    blocker_id BIGINT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id BIGINT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_user_blocks_blocker_blocked UNIQUE (blocker_id, blocked_id),
    CONSTRAINT chk_user_blocks_not_self CHECK (blocker_id <> blocked_id)
);

CREATE INDEX idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX idx_user_blocks_blocked ON user_blocks(blocked_id);
