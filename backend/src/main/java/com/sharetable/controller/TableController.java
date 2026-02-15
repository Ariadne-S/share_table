package com.sharetable.controller;

import com.sharetable.domain.Table;
import com.sharetable.domain.User;
import com.sharetable.dto.CreateTableRequest;
import com.sharetable.dto.TableResponse;
import com.sharetable.dto.TableSummaryResponse;
import com.sharetable.service.TableService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** REST controller for table CRUD: list, create, get by share token, soft delete. */
@RestController
@RequestMapping("/tables")
public class TableController {

  private final TableService tableService;
  private final UserResolver userResolver;

  public TableController(TableService tableService, UserResolver userResolver) {
    this.tableService = tableService;
    this.userResolver = userResolver;
  }

  @GetMapping
  public ResponseEntity<List<TableSummaryResponse>> listTables() {
    return ResponseEntity.ok(tableService.findAllSummaries());
  }

  @PostMapping
  public ResponseEntity<TableResponse> createTable(
      @Valid @RequestBody CreateTableRequest request,
      @RequestHeader(value = UserResolver.HEADER_USER_ID, required = false) UUID userId,
      @RequestHeader(value = UserResolver.HEADER_USER_NAME, required = false) String userName) {
    Optional<User> user = userResolver.resolve(userId, userName);
    Table table = tableService.createTable(request, user);
    return ResponseEntity.status(HttpStatus.CREATED).body(TableResponse.from(table));
  }

  @GetMapping("/{shareToken}")
  public ResponseEntity<TableResponse> getByShareToken(@PathVariable UUID shareToken) {
    return tableService
        .findByShareToken(shareToken)
        .map(table -> ResponseEntity.ok(TableResponse.from(table)))
        .orElse(ResponseEntity.notFound().build());
  }

  @DeleteMapping("/{shareToken}")
  public ResponseEntity<Void> deleteTable(
      @PathVariable UUID shareToken,
      @RequestHeader(value = UserResolver.HEADER_USER_ID, required = false) UUID userId,
      @RequestHeader(value = UserResolver.HEADER_USER_NAME, required = false) String userName) {
    Optional<User> user = userResolver.resolve(userId, userName);
    return tableService.softDeleteByShareToken(shareToken, user)
        ? ResponseEntity.noContent().build()
        : ResponseEntity.notFound().build();
  }
}
