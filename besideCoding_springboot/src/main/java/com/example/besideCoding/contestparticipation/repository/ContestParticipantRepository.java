package com.example.besideCoding.contestparticipation.repository;

import com.example.besideCoding.contest.model.Contest;
import com.example.besideCoding.contestparticipation.model.ContestParticipant;
import com.example.besideCoding.signup.model.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ContestParticipantRepository extends JpaRepository<ContestParticipant, Long> {
    Optional<ContestParticipant> findByUserAndContest(Users user, Contest contest);

    int countByUser(Users user);

    int countByContest(Contest contest);

    List<ContestParticipant> findByContest(Contest contest);

    /**
     * True while the user is taking part in a contest whose window contains {@code now}.
     * Used to keep assistant hints away from anyone in a running contest.
     */
    @Query("""
            select count(participant) > 0
            from ContestParticipant participant
            where participant.user.id = :userId
              and participant.ended = false
              and participant.contest.visible = true
              and participant.contest.startTime <= :now
              and participant.contest.endTime >= :now
            """)
    boolean isUserInActiveContest(@Param("userId") int userId, @Param("now") LocalDateTime now);
}
