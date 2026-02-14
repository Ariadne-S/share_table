package com.sharetable.controller;

import com.sharetable.domain.Row;
import com.sharetable.dto.RowResponse;
import com.sharetable.dto.UpdateCellsRequest;
import com.sharetable.service.RowService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/tables/{shareToken}/rows")
public class RowController {

    private final RowService rowService;

    public RowController(RowService rowService) {
        this.rowService = rowService;
    }

    @PostMapping
    public ResponseEntity<RowResponse> addRow(@PathVariable UUID shareToken) {
        return rowService.addRow(shareToken)
            .map(row -> ResponseEntity.status(HttpStatus.CREATED).body(RowResponse.from(row)))
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{rowId}")
    public ResponseEntity<Void> deleteRow(@PathVariable UUID shareToken, @PathVariable UUID rowId) {
        return rowService.deleteRow(shareToken, rowId)
            ? ResponseEntity.noContent().build()
            : ResponseEntity.notFound().build();
    }

    @PatchMapping("/{rowId}/cells")
    public ResponseEntity<RowResponse> updateCells(
            @PathVariable UUID shareToken,
            @PathVariable UUID rowId,
            @RequestBody UpdateCellsRequest request) {
        return rowService.updateCells(shareToken, rowId, request)
            .map(row -> ResponseEntity.ok(RowResponse.from(row)))
            .orElse(ResponseEntity.notFound().build());
    }
}
