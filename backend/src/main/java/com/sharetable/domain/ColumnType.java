package com.sharetable.domain;

import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Supported column types with validation rules. Used to validate cell values
 * when updating via the API.
 */
public enum ColumnType {
    STRING,
    NUMBER,
    DATE,
    DATETIME,
    TIME,
    BOOLEAN,
    URL,
    EMAIL,
    CURRENCY,
    ENUM;

    private static final Set<String> VALID_TYPES =
        Set.of("string", "number", "date", "datetime", "time", "boolean", "url", "email", "currency", "enum");
    private static final Pattern ISO_DATE = Pattern.compile("^\\d{4}-\\d{2}-\\d{2}$");
    private static final Pattern ISO_DATETIME =
        Pattern.compile("^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}(:\\d{2})?(\\.\\d+)?([+-]\\d{2}:\\d{2}|Z)?$");
    private static final Pattern TIME_PATTERN = Pattern.compile("^\\d{1,2}:\\d{2}(:\\d{2})?$");
    private static final Pattern URL_PATTERN =
        Pattern.compile("^https?://[^\\s]+$", Pattern.CASE_INSENSITIVE);
    private static final Pattern EMAIL_PATTERN =
        Pattern.compile("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");

    /**
     * Normalizes a type string to a valid column type (string, number, date, etc.).
     * Returns "string" for null, blank, or unknown types.
     */
    public static String normalize(String type) {
        if (type == null || type.isBlank()) return "string";
        var lower = type.trim().toLowerCase();
        if ("text".equals(lower)) return "string";
        return VALID_TYPES.contains(lower) ? lower : "string";
    }

    /**
     * Validates a cell value against the column type. Throws IllegalArgumentException
     * if the value is invalid (e.g. non-numeric for number, invalid date format, etc.).
     */
    public static void validateCellValue(String type, String value, List<String> enumValues) {
        if (value == null || value.isBlank()) return;

        var normalized = normalize(type);
        switch (normalized) {
            case "string" -> { /* any value ok */ }
            case "number", "currency" -> {
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
            case "datetime" -> {
                var v = value.trim();
                if (!ISO_DATETIME.matcher(v).matches() && !ISO_DATE.matcher(v).matches()) {
                    throw new IllegalArgumentException(
                        "Value must be a datetime (YYYY-MM-DD or YYYY-MM-DDTHH:mm): " + value);
                }
            }
            case "time" -> {
                if (!TIME_PATTERN.matcher(value.trim()).matches()) {
                    throw new IllegalArgumentException("Value must be a time (HH:mm or HH:mm:ss): " + value);
                }
            }
            case "boolean" -> {
                var v = value.trim().toLowerCase();
                if (!"true".equals(v) && !"false".equals(v) && !"yes".equals(v) && !"no".equals(v)
                    && !"1".equals(v) && !"0".equals(v)) {
                    throw new IllegalArgumentException("Value must be true/false: " + value);
                }
            }
            case "url" -> {
                var v = value.trim();
                if (!v.isEmpty() && !URL_PATTERN.matcher(v).matches()) {
                    throw new IllegalArgumentException("Value must be a valid URL (http(s)://...): " + value);
                }
            }
            case "email" -> {
                if (!EMAIL_PATTERN.matcher(value.trim()).matches()) {
                    throw new IllegalArgumentException("Value must be a valid email: " + value);
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
