package com.sharetable.service;

import com.sharetable.domain.Column;
import com.sharetable.domain.ColumnType;
import com.sharetable.domain.Table;
import com.sharetable.domain.User;
import com.sharetable.dto.CreateTableRequest;
import com.sharetable.dto.TableSummaryResponse;
import com.sharetable.repository.TableRepository;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Service for table lifecycle: create, find by share token, list summaries, soft delete. */
@Service
public class TableService {

  private final TableRepository tableRepository;
  private final TableUpdateBroadcaster broadcaster;
  private final EntityManager entityManager;

  public TableService(
      TableRepository tableRepository,
      TableUpdateBroadcaster broadcaster,
      EntityManager entityManager) {
    this.tableRepository = tableRepository;
    this.broadcaster = broadcaster;
    this.entityManager = entityManager;
  }

  private static final String SYS_CREATED_AT = "created_at";
  private static final String SYS_MODIFIED_AT = "modified_at";
  private static final String SYS_MODIFIED_BY = "modified_by";

  @Transactional
  public Table createTable(CreateTableRequest request, Optional<User> createdBy) {
    var table = new Table(request.name());
    createdBy
        .map(u -> entityManager.getReference(User.class, u.getId()))
        .ifPresent(table::setCreatedBy);

    int order = 0;
    if (request.columns() != null) {
      for (var col : request.columns()) {
        var type = ColumnType.normalize(col.type());
        var colOrder = col.order() != null ? col.order() : order;
        var enumValues =
            col.enumValues() != null
                ? col.enumValues().stream()
                    .filter(v -> v != null && !v.isBlank())
                    .map(String::trim)
                    .toList()
                : List.<String>of();
        table.getColumns().add(new Column(table, col.name(), type, colOrder, enumValues));
        order++;
      }
    }

    // Default columns: Created At, Modified At, Modified By (auto-populated on row add/edit)
    table
        .getColumns()
        .add(new Column(table, "Created At", "datetime", order++, List.of(), SYS_CREATED_AT));
    table
        .getColumns()
        .add(new Column(table, "Modified At", "datetime", order++, List.of(), SYS_MODIFIED_AT));
    table
        .getColumns()
        .add(new Column(table, "Modified By", "string", order, List.of(), SYS_MODIFIED_BY));

    var saved = tableRepository.saveAndFlush(table);
    broadcaster.broadcastTableUpdate(saved.getShareToken(), saved);
    return saved;
  }

  @Transactional(readOnly = true)
  public Optional<Table> findByShareToken(UUID shareToken) {
    // Fetch columns only in query; rows loaded lazily to avoid Hibernate MultipleBagFetchException
    return tableRepository.findByShareTokenWithColumns(shareToken);
  }

  @Transactional(readOnly = true)
  public List<TableSummaryResponse> findAllSummaries() {
    return tableRepository.findAllByDeletedAtIsNullOrderByCreatedAtDesc().stream()
        .map(TableSummaryResponse::from)
        .toList();
  }

  @Transactional
  public boolean softDeleteByShareToken(UUID shareToken, Optional<User> modifiedBy) {
    return tableRepository
        .findByShareTokenWithColumns(shareToken)
        .map(
            table -> {
              table.setDeletedAt(Instant.now());
              modifiedBy
                  .map(u -> entityManager.getReference(User.class, u.getId()))
                  .ifPresent(table::markModified);
              tableRepository.save(table);
              return true;
            })
        .orElse(false);
  }

  public static String getSystemColumnCreatedAt() {
    return SYS_CREATED_AT;
  }

  public static String getSystemColumnModifiedAt() {
    return SYS_MODIFIED_AT;
  }

  public static String getSystemColumnModifiedBy() {
    return SYS_MODIFIED_BY;
  }
}
