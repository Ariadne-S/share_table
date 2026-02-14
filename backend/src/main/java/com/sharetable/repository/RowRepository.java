package com.sharetable.repository;

import com.sharetable.domain.Row;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RowRepository extends JpaRepository<Row, UUID> {

  @Query(
      "SELECT DISTINCT r FROM Row r LEFT JOIN FETCH r.cells c LEFT JOIN FETCH c.column WHERE r.table.id = :tableId ORDER BY r.order")
  List<Row> findByTableIdWithCells(@Param("tableId") UUID tableId);

  @Query(
      "SELECT DISTINCT r FROM Row r LEFT JOIN FETCH r.cells c LEFT JOIN FETCH c.column WHERE r.id = :rowId AND r.table.shareToken = :shareToken")
  Optional<Row> findByTableShareTokenAndId(
      @Param("shareToken") UUID shareToken, @Param("rowId") UUID rowId);
}
