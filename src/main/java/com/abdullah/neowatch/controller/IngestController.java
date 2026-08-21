package com.abdullah.neowatch.controller;

import com.abdullah.neowatch.model.Asteroid;
import com.abdullah.neowatch.service.AsteroidService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// Triggers an on-demand pull of NASA's current NEO feed into the database. GET (not POST)
// purely for manual/browser-triggered convenience during early development.
@RestController
public class IngestController {

    private final AsteroidService asteroidService;

    public IngestController(AsteroidService asteroidService) {
        this.asteroidService = asteroidService;
    }

    @GetMapping("/ingest")
    public List<Asteroid> ingest() {
        return asteroidService.ingestTodayAsteroids();
    }
}
