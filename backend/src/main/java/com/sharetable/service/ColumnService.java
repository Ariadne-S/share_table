package com.sharetable.service;

import com.sharetable.domain.Column;
import com.sharetable.domain.ColumnType;
import com.sharetable.domain.User;
import com.sharetable.dto.AddColumnRequest;
import com.sharetable.dto.UpdateColumnRequest;
import com.sharetable.repository.TableRepository;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for column operations: add, update, reorder, delete. Broadcasts changes via WebSocket.
 */
@Service
public class ColumnService {

  private final TableRepository tableRepository;
  private final TableUpdateBroadcaster broadcaster;
  private final EntityManager entityManager;

  public ColumnService(
      TableRepository tableRepository,
      TableUpdateBroadcaster broadcaster,
      EntityManager entityManager) {
    this.tableRepository = tableRepository;
    this.broadcaster = broadcaster;
    this.entityManager = entityManager;
  }

  @Transactional
  public Optional<Column> addColumn(UUID shareToken, AddColumnRequest request, Optional<User> user) {
    return tableRepository
        .findByShareTokenWithColumns(shareToken)
        .map(
            table -> {
              int maxOrder =
                  table.getColumns().stream().mapToInt(Column::getOrder).max().orElse(-1);
              int order = request.order() != null ? request.order() : maxOrder + 1;
              var type = ColumnType.normalize(request.type());
              var enumValues =
                  request.enumValues() != null
                      ? request.enumValues().stream()
                          .filter(v -> v != null && !v.isBlank())
                          .map(String::trim)
                          .toList()
                      : List.<String>of();
              var column = new Column(table, request.name(), type, order, enumValues);
              table.getColumns().add(column);
              user.map(u -> entityManager.getReference(User.class, u.getId()))
                  .ifPresent(table::markModified);
              var saved = tableRepository.save(table);
              broadcaster.broadcastTableUpdate(shareToken, saved);
              return saved.getColumns().stream()
                  .filter(c -> c.getName().equals(request.name()))
                  .filter(c -> c.getOrder() == order)
                  .findFirst()
                  .orElse(column);
            });
  }

  @Transactional
  public Optional<Column> updateColumn(
      UUID shareToken, UUID columnId, UpdateColumnRequest request, Optional<User> user) {
    return tableRepository.findByShareTokenWithColumns(shareToken).stream()
        .flatMap(t -> t.getColumns().stream())
        .filter(c -> c.getId().equals(columnId))
        .findFirst()
        .map(
            column -> {
              var table = column.getTable();
              if (request.name() != null && !request.name().isBlank()) {
                column.setName(request.name());
              }
              if (request.type() != null && !request.type().isBlank()) {
                column.setType(ColumnType.normalize(request.type()));
              }
              if (request.order() != null) {
                column.setOrder(request.order());
              }
              if (request.enumValues() != null) {
                column.setEnumValues(
                    request.enumValues().stream()
                        .filter(v -> v != null && !v.isBlank())
                        .map(String::trim)
                        .toList());
              }
              user.map(u -> entityManager.getReference(User.class, u.getId()))
                  .ifPresent(table::markModified);
              tableRepository.save(table);
              broadcaster.broadcastTableUpdate(shareToken, table);
              return column;
            });
  }

  @Transactional
  public boolean reorderColumns(UUID shareToken, List<UUID> columnIds, Optional<User> user) {
    var tableOpt = tableRepository.findByShareTokenWithColumns(shareToken);
    if (tableOpt.isEmpty() || columnIds == null || columnIds.isEmpty()) return false;
    var table = tableOpt.get();
    var tableColumnIds = Set.copyOf(table.getColumns().stream().map(Column::getId).toList());
    if (!tableColumnIds.equals(Set.copyOf(columnIds))) return false;
    for (int i = 0; i < columnIds.size(); i++) {
      final int order = i;
      var colId = columnIds.get(i);
      table.getColumns().stream()
          .filter(c -> c.getId().equals(colId))
          .findFirst()
          .ifPresent(c -> c.setOrder(order));
    }
    user.map(u -> entityManager.getReference(User.class, u.getId()))
        .ifPresent(table::markModified);
    tableRepository.save(table);
    broadcaster.broadcastTableUpdate(shareToken, table);
    return true;
  }

  @Transactional
  public boolean deleteColumn(UUID shareToken, UUID columnId, Optional<User> user) {
    var table = tableRepository.findByShareTokenWithColumns(shareToken).orElse(null);
    if (table == null) return false;

    var toRemove = table.getColumns().stream().filter(c -> c.getId().equals(columnId)).findFirst();
    if (toRemove.isEmpty()) return false;

    table.getColumns().remove(toRemove.get());
    user.map(u -> entityManager.getReference(User.class, u.getId()))
        .ifPresent(table::markModified);
    tableRepository.save(table);
    broadcaster.broadcastTableUpdate(shareToken, table);
    return true;
  }
}
