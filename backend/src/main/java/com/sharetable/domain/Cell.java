package com.sharetable.domain;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@jakarta.persistence.Table(name = "cell")
@IdClass(Cell.CellId.class)
public class Cell {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "row_id", nullable = false)
    private Row row;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "column_id", nullable = false)
    private Column column;

    @jakarta.persistence.Column(name = "value")
    private String value;

    protected Cell() {}

    public Cell(Row row, Column column, String value) {
        this.row = row;
        this.column = column;
        this.value = value;
    }

    public Row getRow() {
        return row;
    }

    public Column getColumn() {
        return column;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public static class CellId implements java.io.Serializable {
        private UUID row;
        private UUID column;

        public CellId() {}

        public CellId(UUID row, UUID column) {
            this.row = row;
            this.column = column;
        }

        public UUID getRow() { return row; }
        public void setRow(UUID row) { this.row = row; }
        public UUID getColumn() { return column; }
        public void setColumn(UUID column) { this.column = column; }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof CellId that)) return false;
            return java.util.Objects.equals(row, that.row) && java.util.Objects.equals(column, that.column);
        }

        @Override
        public int hashCode() {
            return java.util.Objects.hash(row, column);
        }
    }
}
