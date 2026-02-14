package com.sharetable.dto;

import com.sharetable.domain.Table;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

public record TableResponse(
    UUID id,
    UUID shareToken,
    String name,
    Instant createdAt,
    List<ColumnResponse> columns,
    List<RowResponse> rows
) {
    public static TableResponse from(Table table) {
        var columns = table.getColumns().stream()
            .sorted(Comparator.comparingInt(c -> c.getOrder()))
            .map(ColumnResponse::from)
            .toList();
        return new TableResponse(
            table.getId(),
            table.getShareToken(),
            table.getName(),
            table.getCreatedAt(),
            columns,
            table.getRows().stream().map(RowResponse::from).toList()
        );
    }
}
