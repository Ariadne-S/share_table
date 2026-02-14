package com.sharetable.domain;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * A row in a table. Has an ordered position and contains cells (one per column).
 */
@Entity
@jakarta.persistence.Table(name = "table_row")
public class Row {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id", nullable = false)
    private Table table;

    @jakarta.persistence.Column(name = "ord", nullable = false)
    private int order;

    @OneToMany(mappedBy = "row", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Cell> cells = new ArrayList<>();

    protected Row() {}

    public Row(Table table, int order) {
        this.table = table;
        this.order = order;
    }

    public UUID getId() {
        return id;
    }

    public Table getTable() {
        return table;
    }

    public int getOrder() {
        return order;
    }

    public void setOrder(int order) {
        this.order = order;
    }

    public List<Cell> getCells() {
        return cells;
    }
}
