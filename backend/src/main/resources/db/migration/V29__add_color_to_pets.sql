-- 펫별 식별 색상 (#RRGGBB). 캘린더 마커·홈 요약 등에서 어떤 펫인지 직관적으로 구분.
-- 보호자가 펫 생성/수정 시 큐레이션된 팔레트에서 직접 고른다. null 허용 — 기존 펫은
-- 색 미지정 상태로 두고, 프론트가 펫 id 기반 기본 팔레트 색으로 폴백.
ALTER TABLE pets
    ADD COLUMN color VARCHAR(7);
