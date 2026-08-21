package com.abdullah.neowatch.service;

import com.abdullah.neowatch.client.NasaClient;
import com.abdullah.neowatch.model.Asteroid;
import com.abdullah.neowatch.repository.AsteroidRepository;
import org.springframework.stereotype.Service;

import java.util.List;

// Coordinates fetching the current NEO feed from NASA (NasaClient) and persisting it
// (AsteroidRepository); kept thin on purpose so NasaClient stays a pure API client.
@Service
public class AsteroidService {

    private final NasaClient nasaClient;
    private final AsteroidRepository asteroidRepository;

    public AsteroidService(NasaClient nasaClient, AsteroidRepository asteroidRepository) {
        this.nasaClient = nasaClient;
        this.asteroidRepository = asteroidRepository;
    }

    // No dedup on nasaId yet: calling /ingest repeatedly inserts duplicate rows for the same
    // asteroid rather than updating existing ones
    public List<Asteroid> ingestTodayAsteroids() {
        List<Asteroid> asteroids = nasaClient.fetchTodayAsteroids();
        return asteroidRepository.saveAll(asteroids);
    }
}
