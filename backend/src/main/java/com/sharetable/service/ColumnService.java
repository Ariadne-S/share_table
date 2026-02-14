package com.sharetable.service;

import com.sharetable.domain.Column;
import com.sharetable.domain.ColumnType;
import com.sharetable.domain.Table;
import com.sharetable.dto.AddColumnRequest;
import com.sharetable.dto.UpdateColumnRequest;
import com.sharetable.repository.TableRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class ColumnService {

    private final TableRepository tableRepository;
    private final TableUpdateBroadcaster broadcaster;

    public ColumnService(TableRepository tableRepository, TableUpdateBroadcaster broadcaster) {
        this.tableRepository = tableRepository;
        this.broadcaster = broadcaster;
    }

    @Transactional
    public Optional<Column> addColumn(UUID shareToken, AddColumnRequest request) {
        return tableRepository.findByShareTokenWithColumns(shareToken)
            .map(table -> {
                int maxOrder = table.getColumns().stream()
                    .mapToInt(Column::getOrder)
                    .max()
                    .orElse(-1);
                int order = request.order() != null ? request.order() : maxOrder + 1;
                var type = ColumnType.normalize(request.type());
                var enumValues = request.enumValues() != null ? request.enumValues().stream()
                    .filter(v -> v != null && !v.isBlank())
                    .map(String::trim)
                    .toList() : List.<String>of();
                var column = new Column(table, request.name(), type, order, enumValues);
                table.getColumns().add(column);
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
    public Optional<Column> updateColumn(UUID shareToken, UUID columnId, UpdateColumnRequest request) {
        return tableRepository.findByShareTokenWithColumns(shareToken)
            .stream()
            .flatMap(t -> t.getColumns().stream())
            .filter(c -> c.getId().equals(columnId))
            .findFirst()
            .map(column -> {
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
                    column.setEnumValues(request.enumValues().stream()
                        .filter(v -> v != null && !v.isBlank())
                        .map(String::trim)
                        .toList());
                }
                broadcaster.broadcastTableUpdate(shareToken, column.getTable());
                return column;
            });
    }

    @Transactional
    public boolean deleteColumn(UUID shareToken, UUID columnId) {
        var table = tableRepository.findByShareTokenWithColumns(shareToken).orElse(null);
        if (table == null) return false;

        var toRemove = table.getColumns().stream()
            .filter(c -> c.getId().equals(columnId))
            .findFirst();
        if (toRemove.isEmpty()) return false;

        table.getColumns().remove(toRemove.get());
        tableRepository.save(table);
        broadcaster.broadcastTableUpdate(shareToken, table);
        return true;
    }
}
