package com.example.besideCoding.assistant;

import java.util.concurrent.Executor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

@Configuration
public class AssistantConfig {

    /**
     * Answers block on the upstream provider, so they must not run on the servlet thread.
     */
    @Bean(name = "assistantExecutor")
    public Executor assistantExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("assistant-");
        executor.initialize();
        return executor;
    }
}
