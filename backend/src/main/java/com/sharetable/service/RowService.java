package com.sharetable.service;

import com.sharetable.domain.*;
import com.sharetable.dto.UpdateCellsRequest;
import com.sharetable.repository.RowRepository;
import com.sharetable.repository.TableRepository;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for row and cell operations: add row, delete row, update cells. Validates cell values
 * against column type. Broadcasts changes via WebSocket.
 */
@Service
public class RowService {

  private final TableRepository tableRepository;
  private final RowRepository rowRepository;
  private final TableUpdateBroadcaster broadcaster;
  private final EntityManager entityManager;

  public RowService(
      TableRepository tableRepository,
      RowRepository rowRepository,
      TableUpdateBroadcaster broadcaster,
      EntityManager entityManager) {
    this.tableRepository = tableRepository;
    this.rowRepository = rowRepository;
    this.broadcaster = broadcaster;
    this.entityManager = entityManager;
  }

  @Transactional(readOnly = true)
  public Optional<Row> findRow(UUID shareToken, UUID rowId) {
    return rowRepository.findByTableShareTokenAndId(shareToken, rowId);
  }

  @Transactional
  public Optional<Row> addRow(UUID shareToken, Optional<User> user) {
    return tableRepository
        .findByShareTokenWithColumns(shareToken)
        .map(
            table -> {
              int maxOrder = table.getRows().stream().mapToInt(Row::getOrder).max().orElse(-1);
              var row = new Row(table, maxOrder + 1);
              table.getRows().add(row);
              populateSystemCells(row, table, user);
              user.map(u -> entityManager.getReference(User.class, u.getId()))
                  .ifPresent(table::markModified);
              entityManager.flush();
              broadcaster.broadcastTableUpdate(shareToken, table);
              return row;
            });
  }

  @Transactional
  public boolean deleteRow(UUID shareToken, UUID rowId, Optional<User> user) {
    var rowOpt = rowRepository.findByTableShareTokenAndId(shareToken, rowId);
    if (rowOpt.isEmpty()) return false;
    var row = rowOpt.get();
    var table = row.getTable();
    table.getRows().remove(row);
    rowRepository.delete(row);
    user.map(u -> entityManager.getReference(User.class, u.getId())).ifPresent(table::markModified);
    entityManager.flush();
    broadcaster.broadcastTableUpdate(shareToken, table);
    return true;
  }

  @Transactional
  public Optional<Row> updateCells(
      UUID shareToken, UUID rowId, UpdateCellsRequest request, Optional<User> user) {
    if (request.cells() == null || request.cells().isEmpty()) {
      return findRow(shareToken, rowId);
    }

    return rowRepository
        .findByTableShareTokenAndId(shareToken, rowId)
        .map(
            row -> {
              var table = row.getTable();
              for (var entry : request.cells().entrySet()) {
                var columnId = entry.getKey();
                var value = entry.getValue();

                var column =
                    table.getColumns().stream()
                        .filter(c -> c.getId().equals(columnId))
                        .findFirst()
                        .orElse(null);

                if (column != null && !column.isSystemColumn()) {
                  ColumnType.validateCellValue(column.getType(), value, column.getEnumValues());
                  var existingCell =
                      row.getCells().stream()
                          .filter(c -> c.getColumn().getId().equals(columnId))
                          .findFirst();

                  if (existingCell.isPresent()) {
                    existingCell.get().setValue(value);
                  } else {
                    row.getCells().add(new Cell(row, column, value));
                  }
                }
              }
              updateSystemCellsForEdit(row, table, user);
              user.map(u -> entityManager.getReference(User.class, u.getId()))
                  .ifPresent(table::markModified);
              var saved = rowRepository.save(row);
              entityManager.flush();
              broadcaster.broadcastTableUpdate(shareToken, table);
              return saved;
            });
  }

  private static final String SYS_CREATED_AT = "created_at";
  private static final String SYS_MODIFIED_AT = "modified_at";
  private static final String SYS_MODIFIED_BY = "modified_by";

  private void populateSystemCells(Row row, Table table, Optional<User> user) {
    var now = Instant.now().toString();
    var by = user.map(User::getDisplayName).orElse("Anonymous");
    for (var col : table.getColumns()) {
      if (col.isSystemColumn()) {
        String value =
            switch (col.getSystemColumn()) {
              case SYS_CREATED_AT, SYS_MODIFIED_AT -> now;
              case SYS_MODIFIED_BY -> by;
              default -> "";
            };
        if (!value.isEmpty()) {
          row.getCells().add(new Cell(row, col, value));
        }
      }
    }
  }

  private void updateSystemCellsForEdit(Row row, Table table, Optional<User> user) {
    var now = Instant.now().toString();
    var by = user.map(User::getDisplayName).orElse("Anonymous");
    for (var col : table.getColumns()) {
      if (SYS_MODIFIED_AT.equals(col.getSystemColumn())
          || SYS_MODIFIED_BY.equals(col.getSystemColumn())) {
        var existing =
            row.getCells().stream()
                .filter(c -> c.getColumn().getId().equals(col.getId()))
                .findFirst();
        var value = SYS_MODIFIED_AT.equals(col.getSystemColumn()) ? now : by;
        if (existing.isPresent()) {
          existing.get().setValue(value);
        } else {
          row.getCells().add(new Cell(row, col, value));
        }
      }
    }
  }
}
