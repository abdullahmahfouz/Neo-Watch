package com.abdullah.neowatch.repository;

import com.abdullah.neowatch.model.Asteroid;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface AsteroidRepository extends JpaRepository<Asteroid, Long> {
    // Derived query: Spring Data reads the method name and builds
    // "where is_potentially_hazardous = true" from it, no @Query needed
    List<Asteroid> findByIsPotentiallyHazardousTrue();

    // Asteroid has no direct link to its close approaches (CloseApproach owns that FK), so this
    // starts from CloseApproach and walks back to the asteroid it belongs to
    @Query("select distinct ca.asteroid from CloseApproach ca where ca.approachDate between :start and :end")
    List<Asteroid> findWithApproachBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);
}
