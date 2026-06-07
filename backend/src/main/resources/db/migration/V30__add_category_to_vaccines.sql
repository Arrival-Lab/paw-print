-- 백신 / 정기체크 분리용 카테고리. 같은 반복(recurrence)·D-day·알림 엔진을 공유하되
-- 노출 탭만 가른다: VACCINE=건강 탭 "백신", RECURRING=일상 탭 "정기체크"(벼룩약·심장사상충 등).
-- 기존 데이터는 전부 VACCINE 으로 시작 — 사용자가 수정에서 정기체크로 옮길 수 있음.
ALTER TABLE vaccines
    ADD COLUMN category VARCHAR(20) NOT NULL DEFAULT 'VACCINE';
CREATE INDEX idx_vaccines_category ON vaccines(category);
