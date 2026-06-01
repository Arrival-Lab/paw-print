-- 백신 도메인을 "정기 메디컬·케어"로 확장 — 벼룩약·심장사상충 약 등 월별/분기/연간 반복 일정 지원.
-- recurrence_type: NONE = 단발(기본), MONTHLY = 매월, QUARTERLY = 분기마다, YEARLY = 매년.
-- 알림 발송(D-0) 후 NONE 이 아니면 next_vaccine_at 을 다음 주기로 자동 roll-forward (VaccineAlertScheduler).
ALTER TABLE vaccines
    ADD COLUMN recurrence_type VARCHAR(20) NOT NULL DEFAULT 'NONE';
