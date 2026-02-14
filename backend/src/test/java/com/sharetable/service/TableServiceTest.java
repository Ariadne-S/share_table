package com.sharetable.service;

import com.sharetable.dto.CreateTableRequest;
import com.sharetable.domain.Table;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class TableServiceTest {

    @Autowired
    TableService tableService;

    @Test
    void createTable_withName_onlyCreatesTable() {
        var request = new CreateTableRequest("My Shopping List", null);

        Table table = tableService.createTable(request);

        assertThat(table.getId()).isNotNull();
        assertThat(table.getShareToken()).isNotNull();
        assertThat(table.getName()).isEqualTo("My Shopping List");
        assertThat(table.getColumns()).isEmpty();
        assertThat(table.getRows()).isEmpty();
    }

    @Test
    void createTable_withColumns_createsTableAndColumns() {
        var request = new CreateTableRequest("TV Shows", List.of(
            new CreateTableRequest.ColumnInput("Show", "text", 0, null),
            new CreateTableRequest.ColumnInput("Season", "number", 1, null),
            new CreateTableRequest.ColumnInput("Watched", "string", 2, null)
        ));

        Table table = tableService.createTable(request);

        assertThat(table.getName()).isEqualTo("TV Shows");
        assertThat(table.getColumns()).hasSize(3);
        assertThat(table.getColumns().get(0).getName()).isEqualTo("Show");
        assertThat(table.getColumns().get(0).getType()).isEqualTo("string");
        assertThat(table.getColumns().get(1).getName()).isEqualTo("Season");
        assertThat(table.getColumns().get(1).getType()).isEqualTo("number");
    }

    @Test
    void findByShareToken_returnsTable() {
        var request = new CreateTableRequest("Test Table", null);
        Table created = tableService.createTable(request);
        UUID shareToken = created.getShareToken();

        var found = tableService.findByShareToken(shareToken);

        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(created.getId());
        assertThat(found.get().getName()).isEqualTo("Test Table");
    }

    @Test
    void findByShareToken_unknownToken_returnsEmpty() {
        var found = tableService.findByShareToken(UUID.randomUUID());

        assertThat(found).isEmpty();
    }
}
