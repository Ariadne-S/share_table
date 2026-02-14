package com.sharetable.dto;

import jakarta.validation.constraints.Size;

public record UpdateColumnRequest(
    @Size(max = 255)
    String name,

    @Size(max = 50)
    String type,

    Integer order
) {}
