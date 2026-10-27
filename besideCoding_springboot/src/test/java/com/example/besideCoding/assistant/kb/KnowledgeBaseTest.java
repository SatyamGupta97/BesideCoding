package com.example.besideCoding.assistant.kb;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

class KnowledgeBaseTest {

    private static KnowledgeBase knowledgeBase;

    @BeforeAll
    static void loadCorpus() {
        knowledgeBase = new KnowledgeBase();
        knowledgeBase.load();
    }

    @Test
    void loadsHelpDocumentsFromTheClasspath() {
        assertThat(knowledgeBase.size()).isGreaterThan(10);
    }

    @Test
    void findsTheProfileHelpForProfileQuestions() {
        List<KbChunk> chunks = knowledgeBase.search("how do I edit my profile picture", 4);

        assertThat(chunks).isNotEmpty();
        assertThat(chunks.get(0).document()).isEqualTo("Profile");
    }

    @Test
    void findsTheContestRulesForContestQuestions() {
        List<KbChunk> chunks = knowledgeBase.search("can I get hints during a contest", 4);

        assertThat(chunks).isNotEmpty();
        assertThat(chunks).anyMatch(chunk -> chunk.document().equals("Contests"));
    }

    @Test
    void returnsNothingForAnEmptyQuery() {
        assertThat(knowledgeBase.search("   ", 4)).isEmpty();
    }
}
