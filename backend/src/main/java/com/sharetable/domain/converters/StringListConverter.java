package com.sharetable.domain.converters;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.util.Collections;
import java.util.List;

/** Converts List&lt;String&gt; to/from JSON for DB storage. */
@Converter
public class StringListConverter implements AttributeConverter<List<String>, String> {

  private static final ObjectMapper MAPPER = new ObjectMapper();
  private static final TypeReference<List<String>> TYPE = new TypeReference<>() {};

  @Override
  public String convertToDatabaseColumn(List<String> attribute) {
    if (attribute == null || attribute.isEmpty()) {
      return null;
    }
    try {
      return MAPPER.writeValueAsString(attribute);
    } catch (JsonProcessingException e) {
      throw new IllegalArgumentException("Cannot serialize enum values", e);
    }
  }

  @Override
  public List<String> convertToEntityAttribute(String dbData) {
    if (dbData == null || dbData.isBlank()) {
      return Collections.emptyList();
    }
    try {
      return MAPPER.readValue(dbData, TYPE);
    } catch (JsonProcessingException e) {
      throw new IllegalArgumentException("Cannot deserialize enum values: " + dbData, e);
    }
  }
}
