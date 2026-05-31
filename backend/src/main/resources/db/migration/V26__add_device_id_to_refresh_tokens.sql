-- 디바이스별 refresh token 관리 — 한 사용자가 여러 디바이스를 쓰는 경우
-- (예: S25+ + 폴드7) 각 디바이스가 독립된 refresh token 을 갖도록.
--
-- issueTokens 호출 시 (user, deviceId) 조합으로 기존 토큰만 정리해서
-- 다른 디바이스 세션은 보존. deviceId 가 없는 (= 이번 변경 전) 기존 토큰들은
-- NULL 로 유지되며 자연 만료(30일) 또는 다음 같은 디바이스 로그인 시 정리.
ALTER TABLE refresh_tokens
    ADD COLUMN device_id VARCHAR(64);

CREATE INDEX idx_refresh_tokens_user_device
    ON refresh_tokens(user_id, device_id);
