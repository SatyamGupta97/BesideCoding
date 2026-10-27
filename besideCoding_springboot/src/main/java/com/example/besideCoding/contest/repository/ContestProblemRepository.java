package com.example.besideCoding.contest.repository;

import java.time.LocalDateTime;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.besideCoding.contest.model.ContestProblem;

public interface ContestProblemRepository extends JpaRepository<ContestProblem,Long> {

    /**
     * True when the problem is part of a visible contest running right now. Used to keep
     * hints and solutions away from problems during a live contest.
     */
    @Query("""
            select count(cp) > 0
            from ContestProblem cp
            where cp.problem.id = :problemId
              and cp.contest.visible = true
              and cp.contest.startTime <= :now
              and cp.contest.endTime >= :now
            """)
    boolean isProblemInActiveContest(@Param("problemId") int problemId, @Param("now") LocalDateTime now);
}
