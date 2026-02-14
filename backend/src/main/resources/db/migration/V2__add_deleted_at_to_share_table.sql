ALTER TABLE share_table ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_share_table_deleted_at ON share_table(deleted_at) WHERE deleted_at IS NULL;
