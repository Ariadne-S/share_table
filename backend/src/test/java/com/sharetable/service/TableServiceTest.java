package com.sharetable.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sharetable.domain.Table;
import com.sharetable.dto.CreateTableRequest;
import com.sharetable.repository.TableRepository;
import jakarta.persistence.EntityManager;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TableServiceTest {

  @Mock TableRepository tableRepository;
  @Mock TableUpdateBroadcaster broadcaster;
  @Mock EntityManager entityManager;

  @InjectMocks TableService tableService;

  @Test
  void createTable_withName_onlyCreatesTable() {
    var request = new CreateTableRequest("My Shopping List", null);
    when(tableRepository.saveAndFlush(any(Table.class))).thenAnswer(inv -> inv.getArgument(0));

    Table table = tableService.createTable(request, Optional.empty());

    assertThat(table.getName()).isEqualTo("My Shopping List");
    assertThat(table.getShareToken()).isNotNull();
    assertThat(table.getColumns())
        .hasSize(3)
        .extracting("name")
        .containsExactlyInAnyOrder("Created At", "Modified At", "Modified By");
    assertThat(table.getRows()).isEmpty();
    verify(tableRepository).saveAndFlush(any(Table.class));
    verify(broadcaster).broadcastTableUpdate(table.getShareToken(), table);
  }

  @Test
  void createTable_withColumns_createsTableAndColumns() {
    var request =
        new CreateTableRequest(
            "TV Shows",
            List.of(
                new CreateTableRequest.ColumnInput("Show", "text", 0, null),
                new CreateTableRequest.ColumnInput("Season", "number", 1, null),
                new CreateTableRequest.ColumnInput("Watched", "string", 2, null)));
    when(tableRepository.saveAndFlush(any(Table.class))).thenAnswer(inv -> inv.getArgument(0));

    Table table = tableService.createTable(request, Optional.empty());

    assertThat(table.getName()).isEqualTo("TV Shows");
    assertThat(table.getColumns()).hasSize(6); // 3 custom + 3 default
    assertThat(table.getColumns().get(0).getName()).isEqualTo("Show");
    assertThat(table.getColumns().get(0).getType()).isEqualTo("string");
    assertThat(table.getColumns().get(1).getName()).isEqualTo("Season");
    assertThat(table.getColumns().get(1).getType()).isEqualTo("number");
    verify(tableRepository).saveAndFlush(any(Table.class));
  }

  @Test
  void findByShareToken_returnsTable() {
    var table = new Table("Test Table");
    var shareToken = table.getShareToken();
    when(tableRepository.findByShareTokenWithColumns(shareToken)).thenReturn(Optional.of(table));

    var found = tableService.findByShareToken(shareToken);

    assertThat(found).isPresent();
    assertThat(found.get().getName()).isEqualTo("Test Table");
    assertThat(found.get().getShareToken()).isEqualTo(shareToken);
    verify(tableRepository).findByShareTokenWithColumns(shareToken);
  }

  @Test
  void findByShareToken_unknownToken_returnsEmpty() {
    when(tableRepository.findByShareTokenWithColumns(any(UUID.class))).thenReturn(Optional.empty());

    var found = tableService.findByShareToken(UUID.randomUUID());

    assertThat(found).isEmpty();
  }
}
