package com.example.besideCoding.problem.controller;

import com.example.besideCoding.assistant.contest.ContestLockService;
import com.example.besideCoding.problem.dto.ProblemContributionRequestDTO;
import com.example.besideCoding.problem.dto.ProblemResponseDTO;
import com.example.besideCoding.problem.model.Problems;
import com.example.besideCoding.problem.service.ProblemService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/problems")
//@CrossOrigin(origins = "http://localhost:5173")
public class ProblemController {

    private final ProblemService problemService;
    private final ContestLockService contestLockService;

    @Autowired
    public ProblemController(ProblemService problemService, ContestLockService contestLockService) {
        this.problemService = problemService;
        this.contestLockService = contestLockService;
    }

    @GetMapping
    public ResponseEntity<List<ProblemResponseDTO>> getAllProblems(
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "subCategory", required = false) List<String> subCategories,
            @RequestParam(value = "company", required = false) List<String> companies,
            @RequestParam(value = "searchTerm", required = false) String searchTerm) {

        List<Problems> problems = problemService.getProblems(category, subCategories, companies, searchTerm);
        List<ProblemResponseDTO> response = problems.stream()
                .map(ProblemResponseDTO::fromEntity)
                .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/sub-categories")
    public ResponseEntity<List<String>> getAllSubCategories() {
        List<String> subCategories = problemService.getAllSubCategories();
        return ResponseEntity.ok(subCategories);
    }

    @GetMapping("/companies")
    public ResponseEntity<List<String>> getAllCompanies() {
        List<String> companies = problemService.getAllCompanies();
        return ResponseEntity.ok(companies);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProblemResponseDTO> getProblemById(@PathVariable int id) {
        Problems problem = problemService.getProblemById(id);
        if (problem != null) {
            return ResponseEntity.ok(ProblemResponseDTO.fromEntity(problem));
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * The written solution, kept out of the normal problem payload so it can be locked while
     * the problem is part of a running contest.
     */
    @GetMapping("/{id}/solution")
    public ResponseEntity<Map<String, String>> getSolution(@PathVariable int id, HttpSession session) {
        Object userId = session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Please log in to read solutions."));
        }

        if (contestLockService.isProblemLocked(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message",
                            "The solution is hidden while this problem is part of a live contest."));
        }

        Problems problem = problemService.getProblemById(id);
        if (problem == null) {
            return ResponseEntity.notFound().build();
        }

        String solution = problem.getSolution();
        return ResponseEntity.ok(Map.of("solution", solution == null ? "" : solution));
    }

    @PostMapping("/contribute")
    public ResponseEntity<String> contributeProblem(@RequestBody ProblemContributionRequestDTO dto) {
        try {
            problemService.contributeProblem(dto);
            return ResponseEntity.ok("Problem submitted successfully and awaits approval.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error submitting problem: " + e.getMessage());
        }
    }

    @GetMapping("/counts-by-difficulty")
    public ResponseEntity<Map<String, Long>> getProblemCountsByDifficulty() {
        Map<String, Long> counts = problemService.getProblemCountsByDifficulty();
        return ResponseEntity.ok(counts);
    }
}
