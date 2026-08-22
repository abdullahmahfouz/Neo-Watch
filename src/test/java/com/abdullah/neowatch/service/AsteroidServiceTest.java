package com.abdullah.neowatch.service;

import com.abdullah.neowatch.model.Asteroid;
import com.abdullah.neowatch.model.CloseApproach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

// calculateRiskScore() is a pure calculation (no DB/NASA calls), so it can be tested directly
// without starting the Spring context — the null repositories/client below are never touched
class AsteroidServiceTest {

    private final AsteroidService asteroidService = new AsteroidService(null, null, null, null);

    @Test
    void closerAndFasterMeansHigherRisk() {
        Asteroid asteroid = new Asteroid();
        asteroid.setEstimatedDiameterMinKm(0.2);
        asteroid.setEstimatedDiameterMaxKm(0.4);

        CloseApproach closeCall = new CloseApproach();
        closeCall.setRelativeVelocityKmh(50_000.0);
        closeCall.setMissDistanceKm(10_000.0);

        CloseApproach farCall = new CloseApproach();
        farCall.setRelativeVelocityKmh(50_000.0);
        farCall.setMissDistanceKm(1_000_000.0);

        double closeRisk = asteroidService.calculateRiskScore(asteroid, closeCall);
        double farRisk = asteroidService.calculateRiskScore(asteroid, farCall);

        assertTrue(closeRisk > farRisk);
    }

    @Test
    void matchesTheStatedFormula() {
        Asteroid asteroid = new Asteroid();
        asteroid.setEstimatedDiameterMinKm(1.0);
        asteroid.setEstimatedDiameterMaxKm(3.0); // average = 2.0

        CloseApproach closeApproach = new CloseApproach();
        closeApproach.setRelativeVelocityKmh(10_000.0);
        closeApproach.setMissDistanceKm(500.0);

        // (2.0 * 10_000) / 500 = 40.0
        assertEquals(40.0, asteroidService.calculateRiskScore(asteroid, closeApproach));
    }
}
