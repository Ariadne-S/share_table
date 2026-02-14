package com.sharetable.controller;

import com.sharetable.dto.AddColumnRequest;
import com.sharetable.dto.ColumnResponse;
import com.sharetable.dto.ReorderColumnsRequest;
import com.sharetable.dto.UpdateColumnRequest;
import com.sharetable.service.ColumnService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** REST controller for column operations: add, reorder, update, delete. */
@RestController
@RequestMapping("/tables/{shareToken}/columns")
public class ColumnController {

  private final ColumnService columnService;

  public ColumnController(ColumnService columnService) {
    this.columnService = columnService;
  }

  @PostMapping
  public ResponseEntity<ColumnResponse> addColumn(
      @PathVariable UUID shareToken, @Valid @RequestBody AddColumnRequest request) {
    return columnService
        .addColumn(shareToken, request)
        .map(col -> ResponseEntity.status(HttpStatus.CREATED).body(ColumnResponse.from(col)))
        .orElse(ResponseEntity.notFound().build());
  }

  @PatchMapping("/reorder")
  public ResponseEntity<Void> reorderColumns(
      @PathVariable UUID shareToken, @Valid @RequestBody ReorderColumnsRequest request) {
    return columnService.reorderColumns(shareToken, request.columnIds())
        ? ResponseEntity.ok().build()
        : ResponseEntity.notFound().build();
  }

  @PatchMapping(
      "/{columnId:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}")
  public ResponseEntity<ColumnResponse> updateColumn(
      @PathVariable UUID shareToken,
      @PathVariable UUID columnId,
      @Valid @RequestBody UpdateColumnRequest request) {
    return columnService
        .updateColumn(shareToken, columnId, request)
        .map(col -> ResponseEntity.ok(ColumnResponse.from(col)))
        .orElse(ResponseEntity.notFound().build());
  }

  @DeleteMapping(
      "/{columnId:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}")
  public ResponseEntity<Void> deleteColumn(
      @PathVariable UUID shareToken, @PathVariable UUID columnId) {
    return columnService.deleteColumn(shareToken, columnId)
        ? ResponseEntity.noContent().build()
        : ResponseEntity.notFound().build();
  }
}
