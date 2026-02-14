package com.sharetable.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

/** Request body for creating a new table with optional initial columns. */
public record CreateTableRequest(
    @NotBlank @Size(max = 255) String name, List<ColumnInput> columns) {

  public record ColumnInput(
      @NotBlank @Size(max = 255) String name,
      @Size(max = 50) String type,
      Integer order,
      List<String> enumValues) {}
}
