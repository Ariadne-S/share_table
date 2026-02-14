package com.sharetable.dto;

import com.sharetable.domain.Row;

import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

public record RowResponse(
    UUID id,
    int order,
    Map<UUID, String> cells
) {
    public static RowResponse from(Row row) {
        var cells = row.getCells().stream()
            .collect(Collectors.toMap(c -> c.getColumn().getId(), c -> c.getValue() != null ? c.getValue() : ""));
        return new RowResponse(row.getId(), row.getOrder(), cells);
    }
}
