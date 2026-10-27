package com.example.besideCoding.assistant;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/**
 * Small in-memory guard against runaway assistant usage (the endpoint calls a paid model).
 * One process only; if the API is ever scaled horizontally this needs a shared store.
 */
@Component
public class AssistantRateLimiter {

    private static final long WINDOW_MS = 60L * 60L * 1000L;

    private final Map<Integer, Deque<Long>> hits = new ConcurrentHashMap<>();

    public boolean tryAcquire(int userId, int limitPerHour) {
        if (limitPerHour <= 0) {
            return true;
        }
        long now = System.currentTimeMillis();
        Deque<Long> timestamps = hits.computeIfAbsent(userId, key -> new ArrayDeque<>());
        synchronized (timestamps) {
            while (!timestamps.isEmpty() && now - timestamps.peekFirst() > WINDOW_MS) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= limitPerHour) {
                return false;
            }
            timestamps.addLast(now);
            return true;
        }
    }
}
