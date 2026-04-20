-- 영수증 중복 제출 방지: 거래 고유 ID 저장
ALTER TABLE subscriptions ADD COLUMN transaction_id VARCHAR(255);
CREATE UNIQUE INDEX idx_subscriptions_transaction_id
    ON subscriptions(transaction_id) WHERE transaction_id IS NOT NULL;

-- Refresh token replay 탐지: 사용된 토큰 단기 보관
ALTER TABLE refresh_tokens ADD COLUMN rotated_at TIMESTAMP;
