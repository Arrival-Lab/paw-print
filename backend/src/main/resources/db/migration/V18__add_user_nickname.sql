-- 커뮤니티 표시명. 이메일·실명은 본인만 보고, 다른 사용자에겐 nickname 으로 노출.
-- nullable: 기존 사용자/신규 가입자 모두 마이페이지에서 직접 설정. 게시 전 강제는 서비스 레이어에서.
-- unique: 동명이인 혼란 방지.
ALTER TABLE users
    ADD COLUMN nickname VARCHAR(20);

CREATE UNIQUE INDEX uq_users_nickname ON users(nickname) WHERE nickname IS NOT NULL;
