-- 사용자별 알림 카테고리 on/off. 더보기 > 알림 설정 화면에서 토글.
-- 스케줄러가 발송 직전에 해당 필드를 체크해 false 면 skip.
-- 새 카테고리 추가 시 컬럼 추가 + 스케줄러에 분기 한 줄.
ALTER TABLE users
    ADD COLUMN notify_vaccine BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN notify_care    BOOLEAN NOT NULL DEFAULT TRUE;
