package com.sharetable.service;

import com.sharetable.domain.Row;
import com.sharetable.domain.Table;
import com.sharetable.dto.CreateTableRequest;
import com.sharetable.dto.UpdateCellsRequest;
import com.sharetable.repository.TableRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class RowServiceTest {

    @Autowired
    TableService tableService;
    @Autowired
    RowService rowService;
    @Autowired
    TableRepository tableRepository;

    @Test
    void addRow_createsRow() {
        var table = tableService.createTable(new CreateTableRequest("Test", null));
        UUID shareToken = table.getShareToken();

        var row = rowService.addRow(shareToken);

        assertThat(row).isPresent();
        assertThat(row.get().getId()).isNotNull();
        assertThat(row.get().getOrder()).isEqualTo(0);
    }

    @Test
    void updateCells_setsValue() {
        var request = new CreateTableRequest("Test", java.util.List.of(
            new CreateTableRequest.ColumnInput("Name", "text", 0, null)
        ));
        var table = tableService.createTable(request);
        var row = rowService.addRow(table.getShareToken()).orElseThrow();
        UUID columnId = table.getColumns().get(0).getId();

        var updated = rowService.updateCells(table.getShareToken(), row.getId(),
            new UpdateCellsRequest(Map.of(columnId, "hello")));

        assertThat(updated).isPresent();
        assertThat(updated.get().getCells()).hasSize(1);
        assertThat(updated.get().getCells().get(0).getValue()).isEqualTo("hello");
    }

    @Test
    void deleteRow_removesRow() {
        var table = tableService.createTable(new CreateTableRequest("Test", null));
        var row = rowService.addRow(table.getShareToken()).orElseThrow();

        boolean deleted = rowService.deleteRow(table.getShareToken(), row.getId());

        assertThat(deleted).isTrue();
        assertThat(rowService.findRow(table.getShareToken(), row.getId())).isEmpty();
    }
}
