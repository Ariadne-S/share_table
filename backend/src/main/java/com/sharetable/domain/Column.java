package com.sharetable.domain;

import com.sharetable.domain.converters.StringListConverter;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * A column in a table. Defines the schema: name, type, display order, and optionally enum values
 * for constrained choice columns.
 */
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

  @jakarta.persistence.Column(name = "enum_values")
  @Convert(converter = StringListConverter.class)
  private List<String> enumValues = new ArrayList<>();

  /** System column type: created_at, modified_at, modified_by. Null = regular column. */
  @jakarta.persistence.Column(name = "system_column", length = 20)
  private String systemColumn;

  protected Column() {}

  public Column(Table table, String name, String type, int order) {
    this(table, name, type, order, List.of(), null);
  }

  public Column(Table table, String name, String type, int order, List<String> enumValues) {
    this(table, name, type, order, enumValues, null);
  }

  public Column(
      Table table,
      String name,
      String type,
      int order,
      List<String> enumValues,
      String systemColumn) {
    this.table = table;
    this.name = name;
    this.type = type != null ? type : "text";
    this.order = order;
    this.enumValues = enumValues != null ? new ArrayList<>(enumValues) : new ArrayList<>();
    this.systemColumn = systemColumn;
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

  public List<String> getEnumValues() {
    return enumValues;
  }

  public void setEnumValues(List<String> enumValues) {
    this.enumValues = enumValues != null ? new ArrayList<>(enumValues) : new ArrayList<>();
  }

  public boolean hasEnumConstraint() {
    return enumValues != null && !enumValues.isEmpty();
  }

  public String getSystemColumn() {
    return systemColumn;
  }

  public boolean isSystemColumn() {
    return systemColumn != null && !systemColumn.isBlank();
  }
}
