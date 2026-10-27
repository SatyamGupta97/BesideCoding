package com.example.besideCoding.assistant;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/assistant")
@RequiredArgsConstructor
public class AssistantController {

    private static final long STREAM_TIMEOUT_MS = 180_000L;

    private final AssistantService assistantService;
    private final AssistantProperties properties;

    @PostMapping(value = "/chat", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> chat(
            @RequestBody AssistantChatRequest request,
            HttpSession session) {

        Integer userId = sessionUserId(session);
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        SseEmitter emitter = new SseEmitter(STREAM_TIMEOUT_MS);
        assistantService.stream(request, userId, emitter);
        return ResponseEntity.ok(emitter);
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        return Map.of(
                "enabled", properties.isEnabled(),
                "configured", properties.isConfigured());
    }

    private static Integer sessionUserId(HttpSession session) {
        Object value = session.getAttribute("userId");
        if (value instanceof Number number) {
            return number.intValue();
        }
        return null;
    }
}
