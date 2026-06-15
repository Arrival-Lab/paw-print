-- 사용자 UI/콘텐츠 언어 (ko/en/ja). 푸시 등 비동기 발송 시점에는 Accept-Language 헤더가 없으므로
-- DB 에 저장된 이 값으로 사용자 언어를 결정한다. 기존 사용자는 ko 기본.
-- 프론트에서 언어 변경 시 PATCH /api/users/me/locale 로 동기화.
ALTER TABLE users
    ADD COLUMN locale VARCHAR(8) NOT NULL DEFAULT 'ko';
