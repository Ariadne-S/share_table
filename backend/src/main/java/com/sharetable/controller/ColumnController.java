package com.sharetable.controller;

import com.sharetable.domain.User;
import com.sharetable.dto.AddColumnRequest;
import com.sharetable.dto.ColumnResponse;
import com.sharetable.dto.ReorderColumnsRequest;
import com.sharetable.dto.UpdateColumnRequest;
import com.sharetable.service.ColumnService;
import jakarta.validation.Valid;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** REST controller for column operations: add, reorder, update, delete. */
@RestController
@RequestMapping("/tables/{shareToken}/columns")
public class ColumnController {

  private final ColumnService columnService;
  private final UserResolver userResolver;

  public ColumnController(ColumnService columnService, UserResolver userResolver) {
    this.columnService = columnService;
    this.userResolver = userResolver;
  }

  @PostMapping
  public ResponseEntity<ColumnResponse> addColumn(
      @PathVariable UUID shareToken,
      @Valid @RequestBody AddColumnRequest request,
      @RequestHeader(value = UserResolver.HEADER_USER_ID, required = false) UUID userId,
      @RequestHeader(value = UserResolver.HEADER_USER_NAME, required = false) String userName) {
    Optional<User> user = userResolver.resolve(userId, userName);
    return columnService
        .addColumn(shareToken, request, user)
        .map(col -> ResponseEntity.status(HttpStatus.CREATED).body(ColumnResponse.from(col)))
        .orElse(ResponseEntity.notFound().build());
  }

  @PatchMapping("/reorder")
  public ResponseEntity<Void> reorderColumns(
      @PathVariable UUID shareToken,
      @Valid @RequestBody ReorderColumnsRequest request,
      @RequestHeader(value = UserResolver.HEADER_USER_ID, required = false) UUID userId,
      @RequestHeader(value = UserResolver.HEADER_USER_NAME, required = false) String userName) {
    Optional<User> user = userResolver.resolve(userId, userName);
    return columnService.reorderColumns(shareToken, request.columnIds(), user)
        ? ResponseEntity.ok().build()
        : ResponseEntity.notFound().build();
  }

  @PatchMapping(
      "/{columnId:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}")
  public ResponseEntity<ColumnResponse> updateColumn(
      @PathVariable UUID shareToken,
      @PathVariable UUID columnId,
      @Valid @RequestBody UpdateColumnRequest request,
      @RequestHeader(value = UserResolver.HEADER_USER_ID, required = false) UUID userId,
      @RequestHeader(value = UserResolver.HEADER_USER_NAME, required = false) String userName) {
    Optional<User> user = userResolver.resolve(userId, userName);
    return columnService
        .updateColumn(shareToken, columnId, request, user)
        .map(col -> ResponseEntity.ok(ColumnResponse.from(col)))
        .orElse(ResponseEntity.notFound().build());
  }

  @DeleteMapping(
      "/{columnId:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}}")
  public ResponseEntity<Void> deleteColumn(
      @PathVariable UUID shareToken,
      @PathVariable UUID columnId,
      @RequestHeader(value = UserResolver.HEADER_USER_ID, required = false) UUID userId,
      @RequestHeader(value = UserResolver.HEADER_USER_NAME, required = false) String userName) {
    Optional<User> user = userResolver.resolve(userId, userName);
    return columnService.deleteColumn(shareToken, columnId, user)
        ? ResponseEntity.noContent().build()
        : ResponseEntity.notFound().build();
  }
}
