CREATE TABLE subscriptions (
    id             BIGSERIAL PRIMARY KEY,
    user_id        BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform       VARCHAR(10)  NOT NULL,
    product_id     VARCHAR(255) NOT NULL,
    purchase_token TEXT         NOT NULL,
    status         VARCHAR(20)  NOT NULL,
    started_at     TIMESTAMP    NOT NULL,
    expires_at     TIMESTAMP    NOT NULL,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
