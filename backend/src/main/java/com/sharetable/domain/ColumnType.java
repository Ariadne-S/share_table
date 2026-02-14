package com.sharetable.domain;

import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

public enum ColumnType {
    STRING,
    NUMBER,
    DATE,
    ENUM;

    private static final Set<String> VALID_TYPES = Set.of("string", "number", "date", "enum");
    private static final Pattern ISO_DATE = Pattern.compile("^\\d{4}-\\d{2}-\\d{2}$");

    public static String normalize(String type) {
        if (type == null || type.isBlank()) return "string";
        var lower = type.trim().toLowerCase();
        if ("text".equals(lower)) return "string";
        return VALID_TYPES.contains(lower) ? lower : "string";
    }

    public static void validateCellValue(String type, String value, List<String> enumValues) {
        if (value == null || value.isBlank()) return;

        var normalized = normalize(type);
        switch (normalized) {
            case "string" -> { /* any value ok */ }
            case "number" -> {
                try {
                    Double.parseDouble(value.trim());
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("Value must be a number: " + value);
                }
            }
            case "date" -> {
                if (!ISO_DATE.matcher(value.trim()).matches()) {
                    throw new IllegalArgumentException("Value must be a date (YYYY-MM-DD): " + value);
                }
            }
            case "enum" -> {
                if (enumValues != null && !enumValues.isEmpty() && !enumValues.contains(value.trim())) {
                    throw new IllegalArgumentException(
                        "Value '" + value + "' is not in allowed values: " + enumValues);
                }
            }
            default -> { /* string */ }
        }
    }
}
