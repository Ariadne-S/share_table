package com.sharetable.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record ReorderColumnsRequest(
    @NotNull
    List<UUID> columnIds
) {}
