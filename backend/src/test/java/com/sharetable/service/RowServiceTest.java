package com.sharetable.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sharetable.domain.Column;
import com.sharetable.domain.Row;
import com.sharetable.domain.Table;
import com.sharetable.dto.UpdateCellsRequest;
import com.sharetable.repository.RowRepository;
import com.sharetable.repository.TableRepository;
import jakarta.persistence.EntityManager;
import java.lang.reflect.Field;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RowServiceTest {

  @Mock TableRepository tableRepository;
  @Mock RowRepository rowRepository;
  @Mock TableUpdateBroadcaster broadcaster;
  @Mock EntityManager entityManager;

  @InjectMocks RowService rowService;

  private Table table;
  private UUID shareToken;

  @BeforeEach
  void setUp() {
    table = new Table("Test");
    table.getColumns().add(new Column(table, "Name", "text", 0));
    shareToken = table.getShareToken();
  }

  @Test
  void addRow_createsRow() {
    when(tableRepository.findByShareTokenWithColumns(shareToken)).thenReturn(Optional.of(table));

    var row = rowService.addRow(shareToken, Optional.empty());

    assertThat(row).isPresent();
    assertThat(row.get().getOrder()).isEqualTo(0);
    assertThat(row.get().getTable()).isSameAs(table);
    assertThat(table.getRows()).hasSize(1).first().isSameAs(row.get());
    verify(broadcaster).broadcastTableUpdate(shareToken, table);
  }

  @Test
  void addRow_unknownToken_returnsEmpty() {
    when(tableRepository.findByShareTokenWithColumns(shareToken)).thenReturn(Optional.empty());

    var row = rowService.addRow(shareToken, Optional.empty());

    assertThat(row).isEmpty();
    verify(tableRepository).findByShareTokenWithColumns(shareToken);
  }

  @Test
  void updateCells_setsValue() throws Exception {
    var row = new Row(table, 0);
    var column = table.getColumns().get(0);
    setEntityId(column, UUID.randomUUID());
    setEntityId(row, UUID.randomUUID());
    when(rowRepository.findByTableShareTokenAndId(shareToken, row.getId()))
        .thenReturn(Optional.of(row));
    when(rowRepository.save(any(Row.class))).thenAnswer(inv -> inv.getArgument(0));

    var updated =
        rowService.updateCells(
            shareToken,
            row.getId(),
            new UpdateCellsRequest(Map.of(column.getId(), "hello")),
            Optional.empty());

    assertThat(updated).isPresent();
    assertThat(updated.get().getCells()).hasSize(1);
    assertThat(updated.get().getCells().get(0).getValue()).isEqualTo("hello");
    verify(rowRepository).save(row);
    verify(broadcaster).broadcastTableUpdate(shareToken, table);
  }

  @Test
  void deleteRow_removesRow() throws Exception {
    var row = new Row(table, 0);
    setEntityId(row, UUID.randomUUID());
    table.getRows().add(row);
    when(rowRepository.findByTableShareTokenAndId(shareToken, row.getId()))
        .thenReturn(Optional.of(row));

    boolean deleted = rowService.deleteRow(shareToken, row.getId(), Optional.empty());

    assertThat(deleted).isTrue();
    verify(rowRepository).delete(row);
    verify(broadcaster).broadcastTableUpdate(shareToken, table);
  }

  @Test
  void deleteRow_unknownRow_returnsFalse() {
    var unknownRowId = UUID.randomUUID();
    when(rowRepository.findByTableShareTokenAndId(shareToken, unknownRowId))
        .thenReturn(Optional.empty());

    boolean deleted = rowService.deleteRow(shareToken, unknownRowId, Optional.empty());

    assertThat(deleted).isFalse();
  }

  @Test
  void findRow_returnsRowWhenPresent() throws Exception {
    var row = new Row(table, 0);
    setEntityId(row, UUID.randomUUID());
    when(rowRepository.findByTableShareTokenAndId(shareToken, row.getId()))
        .thenReturn(Optional.of(row));

    var found = rowService.findRow(shareToken, row.getId());

    assertThat(found).isPresent();
    assertThat(found.get()).isSameAs(row);
  }

  @Test
  void findRow_returnsEmptyWhenAbsent() {
    var unknownRowId = UUID.randomUUID();
    when(rowRepository.findByTableShareTokenAndId(shareToken, unknownRowId))
        .thenReturn(Optional.empty());

    var found = rowService.findRow(shareToken, unknownRowId);

    assertThat(found).isEmpty();
  }

  private static void setEntityId(Object entity, UUID id) throws Exception {
    Field idField = entity.getClass().getDeclaredField("id");
    idField.setAccessible(true);
    idField.set(entity, id);
  }
}
