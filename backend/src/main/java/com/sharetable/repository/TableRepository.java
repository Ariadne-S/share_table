package com.sharetable.repository;

import com.sharetable.domain.Table;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface TableRepository extends JpaRepository<Table, UUID> {

    @Query("SELECT DISTINCT t FROM Table t LEFT JOIN FETCH t.columns WHERE t.shareToken = :shareToken")
    Optional<Table> findByShareTokenWithColumns(@Param("shareToken") UUID shareToken);
}
