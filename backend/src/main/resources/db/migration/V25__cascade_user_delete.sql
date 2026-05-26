-- App Store 5.1.1(v) 계정 삭제 대응 — 누락된 ON DELETE CASCADE 추가
-- users 삭제 시 PostgreSQL 이 모든 의존 데이터를 자동으로 정리하도록.

-- share_members.owner_id / member_id — V8 에서 CASCADE 누락
ALTER TABLE share_members DROP CONSTRAINT share_members_owner_id_fkey;
ALTER TABLE share_members
    ADD CONSTRAINT share_members_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE share_members DROP CONSTRAINT share_members_member_id_fkey;
ALTER TABLE share_members
    ADD CONSTRAINT share_members_member_id_fkey
    FOREIGN KEY (member_id) REFERENCES users(id) ON DELETE CASCADE;

-- post_reports.reporter_id — V9 에서 CASCADE 누락
ALTER TABLE post_reports DROP CONSTRAINT post_reports_reporter_id_fkey;
ALTER TABLE post_reports
    ADD CONSTRAINT post_reports_reporter_id_fkey
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE;
