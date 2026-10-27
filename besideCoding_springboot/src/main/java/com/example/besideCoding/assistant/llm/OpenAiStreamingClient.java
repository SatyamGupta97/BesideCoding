package com.example.besideCoding.assistant.llm;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.function.Consumer;

import org.springframework.stereotype.Component;

import com.example.besideCoding.assistant.AssistantProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import lombok.extern.slf4j.Slf4j;

/**
 * Minimal streaming client for any OpenAI-compatible /chat/completions endpoint.
 *
 * <p>Deliberately not Spring AI: the site runs Spring Boot 3.5 on Java 17, and a single
 * streaming call does not justify the extra dependency surface.
 */
@Component
@Slf4j
public class OpenAiStreamingClient {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final AssistantProperties properties;
    private final HttpClient httpClient;

    public OpenAiStreamingClient(AssistantProperties properties) {
        this.properties = properties;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(20))
                .build();
    }

    /**
     * Blocks while the model streams, invoking {@code onToken} for each delta. The caller is
     * responsible for running this off the request thread.
     */
    public void stream(
            List<LlmMessage> messages,
            Consumer<String> onToken,
            Runnable onComplete,
            Consumer<String> onError) {

        HttpRequest request;
        try {
            request = HttpRequest.newBuilder(endpoint())
                    .timeout(Duration.ofSeconds(150))
                    .header("Authorization", "Bearer " + properties.getApiKey())
                    .header("Content-Type", "application/json")
                    .header("Accept", "text/event-stream")
                    .POST(HttpRequest.BodyPublishers.ofString(payload(messages), StandardCharsets.UTF_8))
                    .build();
        } catch (Exception ex) {
            onError.accept("The assistant is not configured correctly.");
            return;
        }

        HttpResponse<InputStream> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());
        } catch (IOException ex) {
            log.warn("Assistant request failed", ex);
            onError.accept("Could not reach the assistant service.");
            return;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            onError.accept("The request was interrupted.");
            return;
        }

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            String body = readQuietly(response.body());
            log.warn("Assistant provider returned {}: {}", response.statusCode(), body);
            onError.accept("The assistant service returned an error (" + response.statusCode() + ").");
            return;
        }

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(response.body(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (!line.startsWith("data:")) {
                    continue;
                }
                String data = line.substring(5).trim();
                if (data.isEmpty() || "[DONE]".equals(data)) {
                    break;
                }
                JsonNode node = MAPPER.readTree(data);
                JsonNode content = node.path("choices").path(0).path("delta").path("content");
                if (!content.isMissingNode() && !content.isNull() && !content.asText().isEmpty()) {
                    onToken.accept(content.asText());
                }
            }
            onComplete.run();
        } catch (Exception ex) {
            log.warn("Assistant stream failed", ex);
            onError.accept("The answer was interrupted.");
        }
    }

    private URI endpoint() {
        String base = properties.getBaseUrl() == null ? "" : properties.getBaseUrl().trim();
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        return URI.create(base + "/chat/completions");
    }

    private String payload(List<LlmMessage> messages) throws Exception {
        ObjectNode root = MAPPER.createObjectNode();
        root.put("model", properties.getModel());
        root.put("stream", true);
        root.put("temperature", properties.getTemperature());
        root.put("max_tokens", properties.getMaxTokens());
        ArrayNode array = root.putArray("messages");
        for (LlmMessage message : messages) {
            array.addObject()
                    .put("role", message.role())
                    .put("content", message.content());
        }
        return MAPPER.writeValueAsString(root);
    }

    private static String readQuietly(InputStream stream) {
        try (InputStream input = stream) {
            return new String(input.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException ex) {
            return "(unreadable body)";
        }
    }
}
