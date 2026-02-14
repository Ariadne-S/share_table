package com.sharetable.dto;

import com.sharetable.domain.Table;

import java.time.Instant;
import java.util.UUID;

public record TableSummaryResponse(
    UUID id,
    UUID shareToken,
    String name,
    Instant createdAt
) {
    public static TableSummaryResponse from(Table table) {
        return new TableSummaryResponse(
            table.getId(),
            table.getShareToken(),
            table.getName(),
            table.getCreatedAt()
        );
    }
}
