package com.abdullah.neowatch.controller;

import com.abdullah.neowatch.dto.DashboardRow;
import com.abdullah.neowatch.model.Asteroid;
import com.abdullah.neowatch.model.CloseApproach;
import com.abdullah.neowatch.model.RiskSnapshot;
import com.abdullah.neowatch.service.AsteroidService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// Read-only endpoints over already-ingested data. Unlike IngestController, these never call
// NASA — they only query what's already in the database.
@RestController
@RequestMapping("/api/neo")
public class NeoController {

    private final AsteroidService asteroidService;

    public NeoController(AsteroidService asteroidService) {
        this.asteroidService = asteroidService;
    }

    // Everything the dashboard needs in one call: union of upcoming + hazardous asteroids,
    // each joined to its next-relevant close approach and current risk score. Prefer this
    // over upcoming()/hazardous() + a history()/risk() loop per asteroid client-side.
    @GetMapping("/dashboard")
    public List<DashboardRow> dashboard() {
        return asteroidService.getDashboardRows();
    }

    @GetMapping("/upcoming")
    public List<Asteroid> upcoming() {
        return asteroidService.getUpcomingAsteroids();
    }

    @GetMapping("/hazardous")
    public List<Asteroid> hazardous() {
        return asteroidService.getHazardousAsteroids();
    }

    @GetMapping("/{id}/history")
    public List<CloseApproach> history(@PathVariable Long id) {
        return asteroidService.getApproachHistory(id);
    }

    @GetMapping("/{id}/risk")
    public double risk(@PathVariable Long id) {
        return asteroidService.getRiskScore(id);
    }

    @GetMapping("/{id}/risk-history")
    public List<RiskSnapshot> riskHistory(@PathVariable Long id) {
        return asteroidService.getRiskHistory(id);
    }
}
