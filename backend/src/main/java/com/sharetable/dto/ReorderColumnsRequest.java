package com.sharetable.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

/** Request body for reordering columns. columnIds must match all existing column IDs. */
public record ReorderColumnsRequest(
    @NotNull
    List<UUID> columnIds
) {}
