package com.sharetable.controller;

import com.sharetable.domain.Table;
import com.sharetable.dto.CreateTableRequest;
import com.sharetable.dto.TableResponse;
import com.sharetable.service.TableService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/tables")
public class TableController {

    private final TableService tableService;

    public TableController(TableService tableService) {
        this.tableService = tableService;
    }

    @PostMapping
    public ResponseEntity<TableResponse> createTable(@Valid @RequestBody CreateTableRequest request) {
        Table table = tableService.createTable(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(TableResponse.from(table));
    }

    @GetMapping("/{shareToken}")
    public ResponseEntity<TableResponse> getByShareToken(@PathVariable UUID shareToken) {
        return tableService.findByShareToken(shareToken)
            .map(table -> ResponseEntity.ok(TableResponse.from(table)))
            .orElse(ResponseEntity.notFound().build());
    }
}
