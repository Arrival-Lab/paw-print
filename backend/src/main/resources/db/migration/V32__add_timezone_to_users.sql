-- 사용자 디바이스 타임존 (IANA, 예: Asia/Seoul, America/New_York). 케어 리마인더·예방접종 알림
-- 스케줄러가 KST 고정 대신 이 값 기준으로 발송 시각을 계산한다. 기존 사용자는 Asia/Seoul 기본.
-- 프론트에서 앱 시작 시 기기 타임존과 다르면 PATCH /api/users/me/timezone 으로 동기화.
ALTER TABLE users
    ADD COLUMN timezone VARCHAR(40) NOT NULL DEFAULT 'Asia/Seoul';
