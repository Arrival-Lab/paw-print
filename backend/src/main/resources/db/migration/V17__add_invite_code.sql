-- 6자리 숫자 초대코드. 24시간 활성 코드끼리는 unique 보장 (partial unique index).
ALTER TABLE share_invitations
    ADD COLUMN invite_code VARCHAR(6);

-- 코드로 조회 자주 함.
CREATE INDEX idx_share_invitations_code ON share_invitations(invite_code) WHERE invite_code IS NOT NULL;
