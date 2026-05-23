-- 같은 이메일로 여러 OAuth provider 연결 가능하도록 provider별 sub 컬럼 추가.
-- 기존 provider/provider_id 컬럼은 "최초 가입 경로" 메타로 유지.
ALTER TABLE users
    ADD COLUMN apple_sub VARCHAR(255),
    ADD COLUMN google_sub VARCHAR(255),
    ADD COLUMN kakao_sub VARCHAR(255);

UPDATE users SET google_sub = provider_id WHERE provider = 'GOOGLE';
UPDATE users SET apple_sub = provider_id WHERE provider = 'APPLE';
UPDATE users SET kakao_sub = provider_id WHERE provider = 'KAKAO';

CREATE UNIQUE INDEX idx_users_apple_sub ON users (apple_sub) WHERE apple_sub IS NOT NULL;
CREATE UNIQUE INDEX idx_users_google_sub ON users (google_sub) WHERE google_sub IS NOT NULL;
CREATE UNIQUE INDEX idx_users_kakao_sub ON users (kakao_sub) WHERE kakao_sub IS NOT NULL;
