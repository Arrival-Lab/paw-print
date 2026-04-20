CREATE TABLE health_metrics (
    id          BIGSERIAL       PRIMARY KEY,
    pet_id      BIGINT          NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    metric_type VARCHAR(50)     NOT NULL,
    metric_name VARCHAR(100),
    value       DECIMAL(10, 2)  NOT NULL,
    unit        VARCHAR(20),
    measured_at DATE            NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_metrics_pet_type_date ON health_metrics(pet_id, metric_type, measured_at);
