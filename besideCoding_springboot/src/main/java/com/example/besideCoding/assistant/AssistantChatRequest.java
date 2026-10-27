package com.example.besideCoding.assistant;

import java.util.List;

/**
 * One request from the assistant panel. {@code problemId} is optional: when present the
 * message is answered in the context of that problem. {@code history} is kept on the client
 * so the backend stays stateless.
 */
public record AssistantChatRequest(String message, Integer problemId, List<ChatTurn> history) {

    public record ChatTurn(String role, String content) {
    }
}
