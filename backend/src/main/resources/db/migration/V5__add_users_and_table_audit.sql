-- User: client-generated ID, no authentication. Frontend sends X-User-Id and X-User-Name.
CREATE TABLE app_user (
    id UUID PRIMARY KEY,
    display_name VARCHAR(255) NOT NULL DEFAULT 'Anonymous',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table audit fields
ALTER TABLE share_table
    ADD COLUMN created_by_id UUID REFERENCES app_user(id),
    ADD COLUMN modified_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN modified_by_id UUID REFERENCES app_user(id);

-- Column: system column type for auto-populated fields (created_at, modified_at, modified_by per row)
ALTER TABLE table_column
    ADD COLUMN system_column VARCHAR(20);

CREATE INDEX idx_share_table_created_by ON share_table(created_by_id);
