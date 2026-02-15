package com.sharetable.dto;

import com.sharetable.domain.Table;
import java.time.Instant;
import java.util.UUID;

public record TableSummaryResponse(
    UUID id,
    UUID shareToken,
    String name,
    Instant createdAt,
    String createdByName,
    Instant modifiedAt,
    String modifiedByName) {

  public static TableSummaryResponse from(Table table) {
    return new TableSummaryResponse(
        table.getId(),
        table.getShareToken(),
        table.getName(),
        table.getCreatedAt(),
        table.getCreatedBy() != null ? table.getCreatedBy().getDisplayName() : null,
        table.getModifiedAt(),
        table.getModifiedBy() != null ? table.getModifiedBy().getDisplayName() : null);
  }
}
