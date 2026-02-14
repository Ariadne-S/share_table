package com.sharetable.dto;

import com.sharetable.domain.Table;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

public record TableResponse(
    UUID id,
    UUID shareToken,
    String name,
    Instant createdAt,
    List<ColumnResponse> columns,
    List<RowResponse> rows
) {
    public static TableResponse from(Table table) {
        return new TableResponse(
            table.getId(),
            table.getShareToken(),
            table.getName(),
            table.getCreatedAt(),
            table.getColumns().stream().map(ColumnResponse::from).toList(),
            table.getRows().stream().map(RowResponse::from).toList()
        );
    }
}
