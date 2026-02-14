package com.sharetable.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sharetable.domain.Table;
import com.sharetable.dto.CreateTableRequest;
import com.sharetable.service.TableService;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(TableController.class)
class TableControllerTest {

  @Autowired MockMvc mockMvc;

  @Autowired ObjectMapper objectMapper;

  @MockBean TableService tableService;

  @Test
  void createTable_returnsCreatedWithShareToken() throws Exception {
    var table = new Table("My List");
    when(tableService.createTable(any(CreateTableRequest.class))).thenReturn(table);

    var request = new CreateTableRequest("My List", null);
    String body = objectMapper.writeValueAsString(request);

    mockMvc
        .perform(post("/tables").contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.shareToken").exists())
        .andExpect(jsonPath("$.name").value("My List"))
        .andExpect(jsonPath("$.columns").isArray());

    verify(tableService).createTable(any(CreateTableRequest.class));
  }

  @Test
  void getByShareToken_returnsTableWhenFound() throws Exception {
    var table = new Table("My List");
    when(tableService.findByShareToken(table.getShareToken())).thenReturn(Optional.of(table));

    mockMvc
        .perform(get("/tables/" + table.getShareToken()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("My List"));

    verify(tableService).findByShareToken(table.getShareToken());
  }

  @Test
  void getByShareToken_unknown_returns404() throws Exception {
    when(tableService.findByShareToken(any(UUID.class))).thenReturn(Optional.empty());

    mockMvc
        .perform(get("/tables/00000000-0000-0000-0000-000000000000"))
        .andExpect(status().isNotFound());

    verify(tableService).findByShareToken(any(UUID.class));
  }
}
