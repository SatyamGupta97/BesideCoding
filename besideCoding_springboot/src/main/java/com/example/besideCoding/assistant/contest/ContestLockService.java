package com.example.besideCoding.assistant.contest;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;

import com.example.besideCoding.contest.repository.ContestProblemRepository;
import com.example.besideCoding.contestparticipation.repository.ContestParticipantRepository;

import lombok.RequiredArgsConstructor;

/**
 * Single source of truth for "may this user get problem help right now?".
 *
 * <p>Two rules, both enforced server-side:
 * <ul>
 *   <li>a problem is locked while it belongs to a visible contest whose window contains now;</li>
 *   <li>a user is locked while they are taking part in such a contest, which also stops them
 *       from pasting the statement into the general chat and asking there.</li>
 * </ul>
 * The rule is deliberately conservative: it applies to every user, not only participants, so
 * opening the practice page cannot side-step it.
 */
@Service
@RequiredArgsConstructor
public class ContestLockService {

    private final ContestProblemRepository contestProblemRepository;
    private final ContestParticipantRepository contestParticipantRepository;

    public boolean isProblemLocked(int problemId) {
        return contestProblemRepository.isProblemInActiveContest(problemId, LocalDateTime.now());
    }

    public boolean isUserInLiveContest(int userId) {
        return contestParticipantRepository.isUserInActiveContest(userId, LocalDateTime.now());
    }
}
