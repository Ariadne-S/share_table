package com.sharetable.service;

import com.sharetable.domain.Column;
import com.sharetable.domain.ColumnType;
import com.sharetable.domain.Table;
import com.sharetable.dto.CreateTableRequest;
import com.sharetable.dto.TableSummaryResponse;
import com.sharetable.repository.TableRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class TableService {

    private final TableRepository tableRepository;
    private final TableUpdateBroadcaster broadcaster;

    public TableService(TableRepository tableRepository, TableUpdateBroadcaster broadcaster) {
        this.tableRepository = tableRepository;
        this.broadcaster = broadcaster;
    }

    @Transactional
    public Table createTable(CreateTableRequest request) {
        var table = new Table(request.name());

        if (request.columns() != null) {
            int order = 0;
            for (var col : request.columns()) {
                var type = ColumnType.normalize(col.type());
                var colOrder = col.order() != null ? col.order() : order;
                var enumValues = col.enumValues() != null ? col.enumValues().stream()
                    .filter(v -> v != null && !v.isBlank())
                    .map(String::trim)
                    .toList() : List.<String>of();
                table.getColumns().add(new Column(table, col.name(), type, colOrder, enumValues));
                order++;
            }
        }

        var saved = tableRepository.save(table);
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
    public boolean softDeleteByShareToken(UUID shareToken) {
        return tableRepository.findByShareTokenWithColumns(shareToken)
            .map(table -> {
                table.setDeletedAt(Instant.now());
                tableRepository.save(table);
                return true;
            })
            .orElse(false);
    }
}
