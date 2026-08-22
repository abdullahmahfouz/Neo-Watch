package com.abdullah.neowatch.repository;

import com.abdullah.neowatch.model.Asteroid;
import com.abdullah.neowatch.model.CloseApproach;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface CloseApproachRepository extends JpaRepository<CloseApproach, Long> {
    // Derived query: Spring Data builds "where asteroid_id = ?" from the method name
    List<CloseApproach> findByAsteroidId(Long asteroidId);

    // A given asteroid shouldn't have two recorded approaches on the same date, so
    // (asteroid, approachDate) is used as the natural key for dedup on re-ingest
    Optional<CloseApproach> findByAsteroidAndApproachDate(Asteroid asteroid, LocalDate approachDate);
}
