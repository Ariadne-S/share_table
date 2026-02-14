package com.sharetable.service;

import com.sharetable.domain.*;
import com.sharetable.dto.UpdateCellsRequest;
import com.sharetable.repository.RowRepository;
import com.sharetable.repository.TableRepository;
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

  public RowService(
      TableRepository tableRepository,
      RowRepository rowRepository,
      TableUpdateBroadcaster broadcaster) {
    this.tableRepository = tableRepository;
    this.rowRepository = rowRepository;
    this.broadcaster = broadcaster;
  }

  @Transactional(readOnly = true)
  public Optional<Row> findRow(UUID shareToken, UUID rowId) {
    return rowRepository.findByTableShareTokenAndId(shareToken, rowId);
  }

  @Transactional
  public Optional<Row> addRow(UUID shareToken) {
    return tableRepository
        .findByShareTokenWithColumns(shareToken)
        .map(
            table -> {
              int maxOrder = table.getRows().stream().mapToInt(Row::getOrder).max().orElse(-1);
              var row = new Row(table, maxOrder + 1);
              table.getRows().add(row);
              tableRepository.save(table);
              broadcaster.broadcastTableUpdate(shareToken, table);
              return row;
            });
  }

  @Transactional
  public boolean deleteRow(UUID shareToken, UUID rowId) {
    var rowOpt = rowRepository.findByTableShareTokenAndId(shareToken, rowId);
    if (rowOpt.isEmpty()) return false;
    var row = rowOpt.get();
    var table = row.getTable();
    table.getRows().remove(row);
    rowRepository.delete(row);
    broadcaster.broadcastTableUpdate(shareToken, table);
    return true;
  }

  @Transactional
  public Optional<Row> updateCells(UUID shareToken, UUID rowId, UpdateCellsRequest request) {
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

                if (column != null) {
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
              var saved = rowRepository.save(row);
              broadcaster.broadcastTableUpdate(shareToken, table);
              return saved;
            });
  }
}
