package com.abdullah.neowatch.service;

import com.abdullah.neowatch.client.NasaClient;
import com.abdullah.neowatch.model.Asteroid;
import com.abdullah.neowatch.model.CloseApproach;
import com.abdullah.neowatch.repository.AsteroidRepository;
import com.abdullah.neowatch.repository.CloseApproachRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

// Coordinates fetching the current NEO feed from NASA (NasaClient) and persisting it
// (AsteroidRepository, CloseApproachRepository); kept thin on purpose so NasaClient stays a
// pure API client.
@Service
public class AsteroidService {

    private final NasaClient nasaClient;
    private final AsteroidRepository asteroidRepository;
    private final CloseApproachRepository closeApproachRepository;

    public AsteroidService(NasaClient nasaClient, AsteroidRepository asteroidRepository,
                            CloseApproachRepository closeApproachRepository) {
        this.nasaClient = nasaClient;
        this.asteroidRepository = asteroidRepository;
        this.closeApproachRepository = closeApproachRepository;
    }

    // No dedup on nasaId yet: calling /ingest repeatedly inserts duplicate rows for the same
    // asteroid rather than updating existing ones
    @Transactional
    public List<Asteroid> ingestTodayAsteroids() {
        List<Asteroid> asteroids = nasaClient.fetchTodayAsteroids();

        // Save asteroids first so each gets a real database id (IDENTITY generation assigns it
        // immediately on insert) before their close approaches, which reference that id, are saved
        List<Asteroid> savedAsteroids = asteroidRepository.saveAll(asteroids);

        List<CloseApproach> closeApproaches = new ArrayList<>();
        for (Asteroid asteroid : savedAsteroids) {
            closeApproaches.addAll(asteroid.getCloseApproaches());
        }
        closeApproachRepository.saveAll(closeApproaches);

        return savedAsteroids;
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
}
