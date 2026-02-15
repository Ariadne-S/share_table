package com.sharetable.repository;

import com.sharetable.domain.Table;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TableRepository extends JpaRepository<Table, UUID> {

  @Query(
      "SELECT t FROM ShareTable t "
          + "LEFT JOIN FETCH t.createdBy LEFT JOIN FETCH t.modifiedBy "
          + "WHERE t.deletedAt IS NULL ORDER BY t.createdAt DESC")
  List<Table> findAllByDeletedAtIsNullOrderByCreatedAtDesc();

  @Query(
      "SELECT DISTINCT t FROM ShareTable t LEFT JOIN FETCH t.columns WHERE t.shareToken = :shareToken AND t.deletedAt IS NULL")
  Optional<Table> findByShareTokenWithColumns(@Param("shareToken") UUID shareToken);
}
