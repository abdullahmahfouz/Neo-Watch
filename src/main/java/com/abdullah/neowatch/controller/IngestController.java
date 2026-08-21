package com.abdullah.neowatch.controller;

import com.abdullah.neowatch.model.Asteroid;
import com.abdullah.neowatch.service.AsteroidService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

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
