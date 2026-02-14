package com.sharetable.dto;

import java.util.Map;
import java.util.UUID;

public record UpdateCellsRequest(
    Map<UUID, String> cells
) {}
