// ProblemResponseDTO.java
package com.example.besideCoding.problem.dto;

import com.example.besideCoding.problem.model.Problems;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.Data;

/**
 * Public view of a problem.
 *
 * <p>Deliberately carries neither the stored answer nor the written solution: the answer key
 * lives inside {@code additional_info}, and both fields are what the contest lock has to
 * protect. The solution is served separately by the gated endpoint in {@code ProblemController}.
 */
@Data
public class ProblemResponseDTO {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private int id;
    private String title;
    private String description;
    private String problemType;
    private String additionalInfo;
    private String company;
    private String difficulty;
    private String category;
    private String subCategory;
    private int likes;
    private int dislikes;
    private int views;
    private boolean hasSolution;

    public static ProblemResponseDTO fromEntity(Problems problem) {
        ProblemResponseDTO dto = new ProblemResponseDTO();
        dto.setId(problem.getId());
        dto.setTitle(problem.getTitle());
        dto.setDescription(problem.getDescription());
        dto.setProblemType(problem.getProblemType() != null ? problem.getProblemType().name() : null);
        dto.setAdditionalInfo(optionsOnly(problem.getAdditionalInfo()));
        dto.setCompany(problem.getCompany());
        dto.setDifficulty(problem.getDifficulty());
        dto.setCategory(problem.getCategory());
        dto.setSubCategory(problem.getSubCategory());
        dto.setLikes(problem.getLikes());
        dto.setDislikes(problem.getDislikes());
        dto.setViews(problem.getViews());
        dto.setHasSolution(problem.getSolution() != null && !problem.getSolution().isBlank());
        return dto;
    }

    /**
     * {@code additional_info} contains {@code options} and {@code answer}; only the options may be
     * returned to a solver.
     */
    private static String optionsOnly(String additionalInfo) {
        if (additionalInfo == null || additionalInfo.isBlank()) {
            return null;
        }
        try {
            JsonNode root = MAPPER.readTree(additionalInfo);
            JsonNode options = root.path("options");
            if (!options.isArray()) {
                return "{}";
            }
            ObjectNode safe = MAPPER.createObjectNode();
            safe.set("options", options);
            return MAPPER.writeValueAsString(safe);
        } catch (Exception ex) {
            return "{}";
        }
    }
}
