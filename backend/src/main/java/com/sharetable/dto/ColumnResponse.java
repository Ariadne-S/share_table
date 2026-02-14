package com.sharetable.dto;

import com.sharetable.domain.Column;
import java.util.List;
import java.util.UUID;

public record ColumnResponse(
    UUID id, String name, String type, int order, List<String> enumValues) {
  public static ColumnResponse from(Column column) {
    return new ColumnResponse(
        column.getId(),
        column.getName(),
        column.getType(),
        column.getOrder(),
        column.getEnumValues() != null ? List.copyOf(column.getEnumValues()) : List.of());
  }
}
