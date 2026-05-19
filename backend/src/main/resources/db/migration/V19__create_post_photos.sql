-- 커뮤니티 게시글 사진 첨부. 다이어리 사진과 동일 패턴 (S3 URL + sort_order).
CREATE TABLE post_photos (
    id          BIGSERIAL PRIMARY KEY,
    post_id     BIGINT      NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    photo_url   TEXT        NOT NULL,
    sort_order  INT         NOT NULL DEFAULT 0,
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_post_photos_post_id ON post_photos(post_id);
