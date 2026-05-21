-- 케어 아이템에 "오늘부터 사용 안 함" 기준 시점 도입.
-- discontinued_from <= 조회 날짜 인 아이템은 그 날 화면에서 제외.
-- 과거 날짜로 이동하면 그날엔 활성이었던 아이템이 그대로 보임 (체크 기록 보존).

ALTER TABLE care_items
    ADD COLUMN discontinued_from DATE NULL;

-- 기존에 deactivate() 된 아이템들(active=false)을 discontinued_from 으로 마이그레이션.
-- 정확한 비활성 시점이 없으므로 updated_at(있으면) / created_at 의 date 로 보수적으로 설정.
UPDATE care_items
SET discontinued_from = COALESCE(updated_at::date, created_at::date)
WHERE active = false
  AND discontinued_from IS NULL;

CREATE INDEX idx_care_items_pet_discontinued
    ON care_items (pet_id, discontinued_from);
