package com.sharetable.dto;

import com.sharetable.domain.Column;

import java.util.UUID;

public record ColumnResponse(
    UUID id,
    String name,
    String type,
    int order
) {
    public static ColumnResponse from(Column column) {
        return new ColumnResponse(
            column.getId(),
            column.getName(),
            column.getType(),
            column.getOrder()
        );
    }
}
