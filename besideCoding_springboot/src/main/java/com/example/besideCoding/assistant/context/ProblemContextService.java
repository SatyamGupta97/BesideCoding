package com.example.besideCoding.assistant.context;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.example.besideCoding.problem.model.Problems;
import com.example.besideCoding.problem.repository.ProblemRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProblemContextService {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final ProblemRepository problemRepository;

    public Optional<ProblemContext> load(Integer problemId) {
        if (problemId == null) {
            return Optional.empty();
        }
        return problemRepository.findById(problemId).map(this::toContext);
    }

    private ProblemContext toContext(Problems problem) {
        String type = problem.getProblemType() != null ? problem.getProblemType().name() : "Integer";
        return new ProblemContext(
                problem.getId(),
                problem.getTitle(),
                problem.getDescription(),
                problem.getDifficulty(),
                problem.getCategory(),
                problem.getSubCategory(),
                problem.getCompany(),
                type,
                "MCQ".equalsIgnoreCase(type) ? optionsOnly(problem.getAdditionalInfo()) : List.of());
    }

    /**
     * {@code additional_info} stores both the MCQ options and the correct answer. Only the
     * options may ever leave the server, so the answer key is dropped here.
     */
    private static List<String> optionsOnly(String additionalInfo) {
        List<String> options = new ArrayList<>();
        if (additionalInfo == null || additionalInfo.isBlank()) {
            return options;
        }
        try {
            JsonNode optionsNode = MAPPER.readTree(additionalInfo).path("options");
            if (optionsNode.isArray()) {
                optionsNode.forEach(node -> options.add(node.asText()));
            }
        } catch (Exception ex) {
            log.debug("Could not parse additional_info for assistant context", ex);
        }
        return options;
    }
}
