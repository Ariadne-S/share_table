package com.sharetable.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sharetable.dto.CreateTableRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class TableControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @Test
    void createTable_returnsCreatedWithShareToken() throws Exception {
        var request = new CreateTableRequest("My List", null);
        String body = objectMapper.writeValueAsString(request);

        var result = mockMvc.perform(post("/tables")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").exists())
            .andExpect(jsonPath("$.shareToken").exists())
            .andExpect(jsonPath("$.name").value("My List"))
            .andExpect(jsonPath("$.columns").isArray())
            .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        String shareToken = objectMapper.readTree(responseBody).get("shareToken").asText();

        mockMvc.perform(get("/tables/" + shareToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("My List"));
    }

    @Test
    void getByShareToken_unknown_returns404() throws Exception {
        mockMvc.perform(get("/tables/00000000-0000-0000-0000-000000000000"))
            .andExpect(status().isNotFound());
    }
}
