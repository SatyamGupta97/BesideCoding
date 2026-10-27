package com.example.besideCoding.assistant;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Data;

/**
 * Configuration for the "Ask Beside" assistant. Every value has a safe default so the
 * application still starts when the assistant has not been configured yet.
 */
@Component
@ConfigurationProperties(prefix = "assistant")
@Data
public class AssistantProperties {

    private boolean enabled = true;
    private String apiKey = "";
    private String baseUrl = "https://api.openai.com/v1";
    private String model = "gpt-4o-mini";
    private double temperature = 0.3;
    private int maxTokens = 700;
    private int maxHistoryMessages = 8;
    private int requestsPerHour = 30;
    private int topKChunks = 4;
    private int maxProblemDescriptionChars = 4000;
    private int maxKbChunkChars = 1400;

    public boolean isConfigured() {
        return enabled && apiKey != null && !apiKey.isBlank();
    }
}
