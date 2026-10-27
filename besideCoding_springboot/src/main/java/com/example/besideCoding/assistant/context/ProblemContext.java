package com.example.besideCoding.assistant.context;

import java.util.List;

/**
 * The answer-free view of a problem handed to the model: statement and metadata only.
 * The stored answer and the solution are deliberately absent.
 */
public record ProblemContext(
        int id,
        String title,
        String description,
        String difficulty,
        String category,
        String subCategory,
        String company,
        String problemType,
        List<String> options) {
}
