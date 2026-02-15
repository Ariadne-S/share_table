package com.sharetable.controller;

import com.sharetable.domain.User;
import com.sharetable.dto.RowResponse;
import com.sharetable.dto.UpdateCellsRequest;
import com.sharetable.service.RowService;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** REST controller for row and cell operations: add row, delete row, update cells. */
@RestController
@RequestMapping("/tables/{shareToken}/rows")
public class RowController {

  private final RowService rowService;
  private final UserResolver userResolver;

  public RowController(RowService rowService, UserResolver userResolver) {
    this.rowService = rowService;
    this.userResolver = userResolver;
  }

  @PostMapping
  public ResponseEntity<RowResponse> addRow(
      @PathVariable UUID shareToken,
      @RequestHeader(value = UserResolver.HEADER_USER_ID, required = false) UUID userId,
      @RequestHeader(value = UserResolver.HEADER_USER_NAME, required = false) String userName) {
    Optional<User> user = userResolver.resolve(userId, userName);
    return rowService
        .addRow(shareToken, user)
        .map(row -> ResponseEntity.status(HttpStatus.CREATED).body(RowResponse.from(row)))
        .orElse(ResponseEntity.notFound().build());
  }

  @DeleteMapping("/{rowId}")
  public ResponseEntity<Void> deleteRow(
      @PathVariable UUID shareToken,
      @PathVariable UUID rowId,
      @RequestHeader(value = UserResolver.HEADER_USER_ID, required = false) UUID userId,
      @RequestHeader(value = UserResolver.HEADER_USER_NAME, required = false) String userName) {
    Optional<User> user = userResolver.resolve(userId, userName);
    return rowService.deleteRow(shareToken, rowId, user)
        ? ResponseEntity.noContent().build()
        : ResponseEntity.notFound().build();
  }

  @PatchMapping("/{rowId}/cells")
  public ResponseEntity<RowResponse> updateCells(
      @PathVariable UUID shareToken,
      @PathVariable UUID rowId,
      @RequestBody UpdateCellsRequest request,
      @RequestHeader(value = UserResolver.HEADER_USER_ID, required = false) UUID userId,
      @RequestHeader(value = UserResolver.HEADER_USER_NAME, required = false) String userName) {
    Optional<User> user = userResolver.resolve(userId, userName);
    return rowService
        .updateCells(shareToken, rowId, request, user)
        .map(row -> ResponseEntity.ok(RowResponse.from(row)))
        .orElse(ResponseEntity.notFound().build());
  }
}
