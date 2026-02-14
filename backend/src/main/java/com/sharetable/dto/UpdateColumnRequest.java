package com.sharetable.dto;

import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateColumnRequest(
    @Size(max = 255)
    String name,

    @Size(max = 50)
    String type,

    Integer order,

    List<String> enumValues
) {}
