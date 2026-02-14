CREATE TABLE share_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE table_column (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID NOT NULL REFERENCES share_table(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'text',
    ord INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE table_row (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID NOT NULL REFERENCES share_table(id) ON DELETE CASCADE,
    ord INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE cell (
    row_id UUID NOT NULL REFERENCES table_row(id) ON DELETE CASCADE,
    column_id UUID NOT NULL REFERENCES table_column(id) ON DELETE CASCADE,
    value TEXT,
    PRIMARY KEY (row_id, column_id)
);

CREATE INDEX idx_table_column_table_id ON table_column(table_id);
CREATE INDEX idx_table_row_table_id ON table_row(table_id);
CREATE INDEX idx_share_table_share_token ON share_table(share_token);
