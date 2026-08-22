package com.abdullah.neowatch.service;

import com.abdullah.neowatch.client.NasaClient;
import com.abdullah.neowatch.model.Asteroid;
import com.abdullah.neowatch.model.CloseApproach;
import com.abdullah.neowatch.model.RiskSnapshot;
import com.abdullah.neowatch.repository.AsteroidRepository;
import com.abdullah.neowatch.repository.CloseApproachRepository;
import com.abdullah.neowatch.repository.RiskSnapshotRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

// Coordinates fetching the current NEO feed from NASA (NasaClient) and persisting it
// (AsteroidRepository, CloseApproachRepository, RiskSnapshotRepository); kept thin on purpose
// so NasaClient stays a pure API client.
@Service
public class AsteroidService {

    private final NasaClient nasaClient;
    private final AsteroidRepository asteroidRepository;
    private final CloseApproachRepository closeApproachRepository;
    private final RiskSnapshotRepository riskSnapshotRepository;

    public AsteroidService(NasaClient nasaClient, AsteroidRepository asteroidRepository,
                            CloseApproachRepository closeApproachRepository,
                            RiskSnapshotRepository riskSnapshotRepository) {
        this.nasaClient = nasaClient;
        this.asteroidRepository = asteroidRepository;
        this.closeApproachRepository = closeApproachRepository;
        this.riskSnapshotRepository = riskSnapshotRepository;
    }

    // Runs automatically every day at midnight (cron: sec min hour day month weekday), in the
    // server's default timezone, so the data stays fresh without anyone hitting /ingest by hand
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public List<Asteroid> ingestTodayAsteroids() {
        List<Asteroid> fetchedAsteroids = nasaClient.fetchTodayAsteroids();

        List<Asteroid> savedAsteroids = new ArrayList<>();
        for (Asteroid fetched : fetchedAsteroids) {
            Asteroid asteroid = upsertAsteroid(fetched);
            for (CloseApproach fetchedApproach : fetched.getCloseApproaches()) {
                CloseApproach closeApproach = upsertCloseApproach(asteroid, fetchedApproach);
                recordRiskSnapshot(asteroid, closeApproach);
            }
            savedAsteroids.add(asteroid);
        }

        return savedAsteroids;
    }

    // Find-or-create by nasaId so re-ingesting the same asteroid updates its existing row
    // instead of inserting a duplicate
    private Asteroid upsertAsteroid(Asteroid fetched) {
        Asteroid asteroid = asteroidRepository.findByNasaId(fetched.getNasaId())
                .orElseGet(Asteroid::new);
        asteroid.setNasaId(fetched.getNasaId());
        asteroid.setName(fetched.getName());
        asteroid.setEstimatedDiameterMinKm(fetched.getEstimatedDiameterMinKm());
        asteroid.setEstimatedDiameterMaxKm(fetched.getEstimatedDiameterMaxKm());
        asteroid.setIsPotentiallyHazardous(fetched.getIsPotentiallyHazardous());
        return asteroidRepository.save(asteroid);
    }

    // Same find-or-create idea, keyed on (asteroid, approachDate) since an asteroid shouldn't
    // have two recorded approaches on the same date
    private CloseApproach upsertCloseApproach(Asteroid asteroid, CloseApproach fetchedApproach) {
        CloseApproach closeApproach = closeApproachRepository
                .findByAsteroidAndApproachDate(asteroid, fetchedApproach.getApproachDate())
                .orElseGet(CloseApproach::new);
        closeApproach.setAsteroid(asteroid);
        closeApproach.setApproachDate(fetchedApproach.getApproachDate());
        closeApproach.setMissDistanceKm(fetchedApproach.getMissDistanceKm());
        closeApproach.setRelativeVelocityKmh(fetchedApproach.getRelativeVelocityKmh());
        closeApproach.setOrbitingBody(fetchedApproach.getOrbitingBody());
        return closeApproachRepository.save(closeApproach);
    }

    // Unlike upsertAsteroid/upsertCloseApproach, this always inserts a new row — one snapshot
    // per ingest is what lets getRiskHistory() show a trend over time instead of one live number
    private void recordRiskSnapshot(Asteroid asteroid, CloseApproach closeApproach) {
        RiskSnapshot snapshot = new RiskSnapshot();
        snapshot.setAsteroid(asteroid);
        snapshot.setCloseApproach(closeApproach);
        snapshot.setRiskScore(calculateRiskScore(asteroid, closeApproach));
        snapshot.setCalculatedAt(LocalDateTime.now());
        riskSnapshotRepository.save(snapshot);
    }

    public List<Asteroid> getHazardousAsteroids() {
        return asteroidRepository.findByIsPotentiallyHazardousTrue();
    }

    public List<Asteroid> getUpcomingAsteroids() {
        LocalDate today = LocalDate.now();
        return asteroidRepository.findWithApproachBetween(today, today.plusDays(7));
    }

    public List<CloseApproach> getApproachHistory(Long asteroidId) {
        return closeApproachRepository.findByAsteroidId(asteroidId);
    }

    // Risk score = average diameter x relative velocity / miss distance — bigger, faster,
    // closer asteroids score higher. Not a real astronomical risk model, just a simple
    // explainable placeholder.
    public double calculateRiskScore(Asteroid asteroid, CloseApproach closeApproach) {
        double avgDiameterKm = (asteroid.getEstimatedDiameterMinKm() + asteroid.getEstimatedDiameterMaxKm()) / 2;
        return (avgDiameterKm * closeApproach.getRelativeVelocityKmh()) / closeApproach.getMissDistanceKm();
    }

    // Reports the single riskiest approach on record for this asteroid, since one asteroid can
    // have many recorded approaches with very different distances/speeds
    public double getRiskScore(Long asteroidId) {
        Asteroid asteroid = asteroidRepository.findById(asteroidId)
                .orElseThrow(() -> new NoSuchElementException("Asteroid not found: " + asteroidId));
        List<CloseApproach> approaches = closeApproachRepository.findByAsteroidId(asteroidId);

        return approaches.stream()
                .mapToDouble(closeApproach -> calculateRiskScore(asteroid, closeApproach))
                .max()
                .orElse(0.0);
    }

    // Oldest-to-newest risk scores recorded for this asteroid across every past ingest —
    // the trend line, as opposed to getRiskScore()'s single live "riskiest approach right now"
    public List<RiskSnapshot> getRiskHistory(Long asteroidId) {
        return riskSnapshotRepository.findByAsteroidIdOrderByCalculatedAtAsc(asteroidId);
    }
}
