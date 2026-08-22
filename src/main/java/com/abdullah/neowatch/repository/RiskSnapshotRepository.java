package com.abdullah.neowatch.repository;

import com.abdullah.neowatch.model.RiskSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

// Spring Data JPA repository for RiskSnapshot rows, used by AsteroidService to record a new
// snapshot on every ingest and to serve NeoController's risk-history endpoint.
public interface RiskSnapshotRepository extends JpaRepository<RiskSnapshot, Long> {
    // Oldest-first so callers can plot/read it directly as a trend line
    List<RiskSnapshot> findByAsteroidIdOrderByCalculatedAtAsc(Long asteroidId);
}
