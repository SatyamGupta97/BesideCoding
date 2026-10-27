package com.example.besideCoding.assistant;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.Executor;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.example.besideCoding.assistant.context.ProblemContext;
import com.example.besideCoding.assistant.context.ProblemContextService;
import com.example.besideCoding.assistant.contest.ContestLockService;
import com.example.besideCoding.assistant.kb.KbChunk;
import com.example.besideCoding.assistant.kb.KnowledgeBase;
import com.example.besideCoding.assistant.llm.LlmMessage;
import com.example.besideCoding.assistant.llm.OpenAiStreamingClient;

import lombok.extern.slf4j.Slf4j;

/**
 * Orchestrates one assistant turn: validate, apply the contest lock, retrieve help, build
 * prompts and relay streamed tokens back to the browser over SSE.
 */
@Service
@Slf4j
public class AssistantService {

    /** Questions that ask for problem help rather than site help. */
    private static final Pattern HINT_REQUEST = Pattern.compile(
            "(?i)\\b(hint|hints|solution|solve|solved|approach|algorithm|logic|answer|ans|"
                    + "pseudocode|complexity|optimis|optimiz|edge case|test case|dry run|"
                    + "how do i (solve|approach|start)|help me (solve|with the problem))\\b");

    private static final int MAX_MESSAGE_CHARS = 4000;

    private final AssistantProperties properties;
    private final KnowledgeBase knowledgeBase;
    private final ProblemContextService problemContextService;
    private final ContestLockService contestLockService;
    private final AssistantPromptBuilder promptBuilder;
    private final OpenAiStreamingClient llmClient;
    private final AssistantRateLimiter rateLimiter;
    private final Executor executor;

    public AssistantService(
            AssistantProperties properties,
            KnowledgeBase knowledgeBase,
            ProblemContextService problemContextService,
            ContestLockService contestLockService,
            AssistantPromptBuilder promptBuilder,
            OpenAiStreamingClient llmClient,
            AssistantRateLimiter rateLimiter,
            @Qualifier("assistantExecutor") Executor executor) {
        this.properties = properties;
        this.knowledgeBase = knowledgeBase;
        this.problemContextService = problemContextService;
        this.contestLockService = contestLockService;
        this.promptBuilder = promptBuilder;
        this.llmClient = llmClient;
        this.rateLimiter = rateLimiter;
        this.executor = executor;
    }

    /** Returns immediately; the answer streams on the assistant executor. */
    public void stream(AssistantChatRequest request, int userId, SseEmitter emitter) {
        executor.execute(() -> run(request, userId, emitter));
    }

    private void run(AssistantChatRequest request, int userId, SseEmitter emitter) {
        try {
            String question = request.message() == null ? "" : request.message().trim();
            if (question.isEmpty()) {
                fail(emitter, "Please type a question first.");
                return;
            }
            if (question.length() > MAX_MESSAGE_CHARS) {
                fail(emitter, "That question is too long. Please shorten it.");
                return;
            }
            if (!properties.isConfigured()) {
                fail(emitter, "Ask Beside is not configured on this server yet.");
                return;
            }
            if (!rateLimiter.tryAcquire(userId, properties.getRequestsPerHour())) {
                fail(emitter, "You have reached the Ask Beside limit for this hour. Please try again later.");
                return;
            }

            Optional<ProblemContext> problem = problemContextService.load(request.problemId());
            boolean problemLocked = problem.map(context -> contestLockService.isProblemLocked(context.id())).orElse(false);
            boolean locked = problemLocked || contestLockService.isUserInLiveContest(userId);

            // Belt and braces: refuse problem help during a live contest without spending a
            // model call, even though the prompt also carries the restriction.
            if (locked && HINT_REQUEST.matcher(question).find()) {
                send(emitter, "blocked", Map.of(
                        "message",
                        "This problem is part of a live contest, so I can only answer questions "
                                + "about the website right now. Ask me again once the contest ends.",
                        "locked", true));
                complete(emitter);
                return;
            }

            List<KbChunk> chunks = knowledgeBase.search(question, properties.getTopKChunks());
            List<LlmMessage> messages = promptBuilder.build(
                    problem, locked, chunks, request.history(), question);

            send(emitter, "meta", Map.of(
                    "locked", locked,
                    "problemTitle", problem.map(ProblemContext::title).orElse(""),
                    "sources", chunks.stream().map(KbChunk::section).distinct().toList()));

            llmClient.stream(
                    messages,
                    token -> sendQuietly(emitter, "token", token),
                    () -> {
                        sendQuietly(emitter, "done", Map.of("ok", true));
                        complete(emitter);
                    },
                    error -> {
                        sendQuietly(emitter, "error", Map.of("message", error));
                        complete(emitter);
                    });
        } catch (Exception ex) {
            log.warn("Assistant turn failed", ex);
            fail(emitter, "Something went wrong while answering. Please try again.");
        }
    }

    private void fail(SseEmitter emitter, String message) {
        sendQuietly(emitter, "error", Map.of("message", message));
        complete(emitter);
    }

    private void sendQuietly(SseEmitter emitter, String event, Object data) {
        try {
            send(emitter, event, data);
        } catch (Exception ex) {
            // The browser closed the stream; nothing useful left to do.
            log.debug("Dropping assistant event {} after disconnect", event, ex);
        }
    }

    private static void send(SseEmitter emitter, String event, Object data) throws IOException {
        emitter.send(SseEmitter.event().name(event).data(data, MediaType.APPLICATION_JSON));
    }

    private static void complete(SseEmitter emitter) {
        try {
            emitter.complete();
        } catch (Exception ignored) {
            // already completed
        }
    }
}
