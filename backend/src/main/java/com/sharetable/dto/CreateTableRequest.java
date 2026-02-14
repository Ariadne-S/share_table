package com.sharetable.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateTableRequest(
    @NotBlank @Size(max = 255)
    String name,

    List<ColumnInput> columns
) {
    public record ColumnInput(
        @NotBlank @Size(max = 255)
        String name,

        @Size(max = 50)
        String type,

        Integer order,

        List<String> enumValues
    ) {}
}
