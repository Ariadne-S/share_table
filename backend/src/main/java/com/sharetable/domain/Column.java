package com.sharetable.domain;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@jakarta.persistence.Table(name = "table_column")
public class Column {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id", nullable = false)
    private Table table;

    @jakarta.persistence.Column(nullable = false)
    private String name;

    @jakarta.persistence.Column(nullable = false)
    private String type = "text";

    @jakarta.persistence.Column(name = "ord", nullable = false)
    private int order;

    protected Column() {}

    public Column(Table table, String name, String type, int order) {
        this.table = table;
        this.name = name;
        this.type = type != null ? type : "text";
        this.order = order;
    }

    public UUID getId() {
        return id;
    }

    public Table getTable() {
        return table;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type != null ? type : "text";
    }

    public int getOrder() {
        return order;
    }

    public void setOrder(int order) {
        this.order = order;
    }
}
