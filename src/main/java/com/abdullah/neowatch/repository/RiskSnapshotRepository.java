package com.abdullah.neowatch.repository;

import com.abdullah.neowatch.model.RiskSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

// Spring Data JPA repository for RiskSnapshot rows, used by AsteroidService to record a new
// snapshot on every ingest and to serve NeoController's impact-energy-history endpoint.
public interface RiskSnapshotRepository extends JpaRepository<RiskSnapshot, Long> {
    // Oldest-first so callers can plot/read it directly as a trend line
    List<RiskSnapshot> findByAsteroidIdOrderByCalculatedAtAsc(Long asteroidId);

    // Retention: every ingest appends a fresh snapshot per approach with no dedup (see
    // AsteroidService.recordImpactEnergySnapshot), so this table grows fastest of the three. Must run
    // before CloseApproachRepository's equivalent delete, since this row's FK to CloseApproach
    // would otherwise block deleting the approach first.
    void deleteByCloseApproach_ApproachDateBefore(LocalDate date);
}
