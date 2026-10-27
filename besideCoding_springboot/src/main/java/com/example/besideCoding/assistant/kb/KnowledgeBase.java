package com.example.besideCoding.assistant.kb;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

/**
 * In-memory help knowledge base.
 *
 * <p>The help corpus is small (a handful of markdown pages), so retrieval is a plain
 * lexical ranking over section-sized chunks. That keeps the feature independent of
 * pgvector / embedding providers that the managed Postgres instance does not offer.
 */
@Component
@Slf4j
public class KnowledgeBase {

    private static final Set<String> STOP_WORDS = Set.of(
            "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "is", "are",
            "do", "does", "how", "i", "my", "me", "it", "this", "that", "can", "you",
            "with", "what", "where", "when", "which", "be", "from", "at", "as", "if",
            "not", "have", "has", "was", "were", "will", "would", "should", "there");

    private final List<IndexedChunk> chunks = new ArrayList<>();
    private final Set<String> vocabulary = new HashSet<>();
    private final Map<String, Integer> documentFrequency = new HashMap<>();

    @PostConstruct
    void load() {
        var resolver = new PathMatchingResourcePatternResolver();
        try {
            Resource[] resources = resolver.getResources("classpath*:assistant/kb/*.md");
            for (Resource resource : resources) {
                String content = StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
                String name = documentName(resource.getFilename());
                for (KbChunk chunk : split(name, content)) {
                    index(chunk);
                }
            }
            log.info("Assistant knowledge base loaded: {} chunks from {} documents",
                    chunks.size(), resources.length);
        } catch (IOException ex) {
            log.warn("Could not load assistant knowledge base", ex);
        }
    }

    public List<KbChunk> search(String query, int limit) {
        Set<String> terms = tokenize(query);
        if (terms.isEmpty() || chunks.isEmpty()) {
            return List.of();
        }

        List<Scored> scored = new ArrayList<>();
        for (IndexedChunk chunk : chunks) {
            double score = score(chunk, terms);
            if (score > 0) {
                scored.add(new Scored(chunk.chunk(), score));
            }
        }

        scored.sort((left, right) -> Double.compare(right.score(), left.score()));
        List<KbChunk> result = new ArrayList<>();
        for (Scored item : scored) {
            if (result.size() >= limit) {
                break;
            }
            result.add(item.chunk());
        }
        return result;
    }

    public int size() {
        return chunks.size();
    }

    private void index(KbChunk chunk) {
        List<String> tokens = new ArrayList<>(tokenize(
                chunk.document() + " " + chunk.section() + " " + chunk.body()));
        Map<String, Integer> frequency = new HashMap<>();
        for (String token : tokens) {
            frequency.merge(token, 1, Integer::sum);
        }
        for (String token : frequency.keySet()) {
            vocabulary.add(token);
            documentFrequency.merge(token, 1, Integer::sum);
        }
        chunks.add(new IndexedChunk(chunk, frequency, tokens.size()));
    }

    private double score(IndexedChunk chunk, Set<String> queryTerms) {
        double total = 0;
        double totalChunks = Math.max(1, chunks.size());

        for (String term : queryTerms) {
            Integer tf = chunk.frequency().get(term);
            if (tf == null) {
                continue;
            }
            int df = documentFrequency.getOrDefault(term, 1);
            double idf = Math.log((totalChunks + 1) / (df + 0.5)) + 1;
            double tfWeight = tf / (tf + 1.2);
            total += idf * tfWeight;
        }

        // Headings are the strongest signal for a help page.
        String heading = (chunk.chunk().document() + " " + chunk.chunk().section()).toLowerCase(Locale.ROOT);
        for (String term : queryTerms) {
            if (heading.contains(term)) {
                total += 1.5;
            }
        }
        return total;
    }

    private static List<KbChunk> split(String document, String markdown) {
        List<KbChunk> result = new ArrayList<>();
        String[] lines = markdown.split("\n", -1);
        String currentSection = "Overview";
        StringBuilder current = new StringBuilder();

        for (String line : lines) {
            if (line.startsWith("## ")) {
                if (!current.toString().isBlank()) {
                    result.add(new KbChunk(document, currentSection, current.toString()));
                }
                currentSection = line.substring(3).trim();
                current.setLength(0);
            } else {
                current.append(line).append('\n');
            }
        }
        if (!current.toString().isBlank()) {
            result.add(new KbChunk(document, currentSection, current.toString()));
        }
        return result;
    }

    static Set<String> tokenize(String text) {
        if (text == null) {
            return Set.of();
        }
        String cleaned = text.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", " ");
        Set<String> terms = new HashSet<>();
        for (String token : Arrays.asList(cleaned.split("\\s+"))) {
            if (token.length() < 2 || STOP_WORDS.contains(token)) {
                continue;
            }
            terms.add(token);
        }
        return terms;
    }

    private static String documentName(String filename) {
        if (filename == null) {
            return "Help";
        }
        String base = filename.replaceFirst("\\.md$", "").replace('-', ' ');
        return Character.toUpperCase(base.charAt(0)) + base.substring(1);
    }

    private record IndexedChunk(KbChunk chunk, Map<String, Integer> frequency, int tokenCount) {
    }

    private record Scored(KbChunk chunk, double score) {
    }
}
