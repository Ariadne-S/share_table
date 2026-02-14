package com.sharetable.dto;

import java.util.Map;
import java.util.UUID;

/** Request body for updating cell values. Map of column ID to value. */
public record UpdateCellsRequest(Map<UUID, String> cells) {}
