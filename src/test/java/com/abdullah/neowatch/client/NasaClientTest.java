package com.abdullah.neowatch.client;

import com.abdullah.neowatch.model.Asteroid;
import com.abdullah.neowatch.model.CloseApproach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.spy;

// fetchTodayAsteroids() does its own JSON parsing on top of fetchTodayFeed()'s network call, so
// each test spies on the real client and stubs out just fetchTodayFeed() with canned JSON —
// the parsing logic underneath runs for real, unmocked.
class NasaClientTest {

    @Test
    void parsesOneAsteroidWithOneCloseApproach() {
        NasaClient nasaClient = spy(new NasaClient());
        doReturn("""
                {
                  "near_earth_objects": {
                    "2026-08-22": [
                      {
                        "id": "2101955",
                        "name": "101955 Bennu",
                        "estimated_diameter": {
                          "kilometers": { "estimated_diameter_min": 0.2, "estimated_diameter_max": 0.4 }
                        },
                        "is_potentially_hazardous_asteroid": true,
                        "close_approach_data": [
                          {
                            "close_approach_date": "2026-08-22",
                            "miss_distance": { "kilometers": "1234.56" },
                            "relative_velocity": { "kilometers_per_hour": "50000.5" },
                            "orbiting_body": "Earth"
                          }
                        ]
                      }
                    ]
                  }
                }
                """).when(nasaClient).fetchTodayFeed();

        List<Asteroid> asteroids = nasaClient.fetchTodayAsteroids();

        assertEquals(1, asteroids.size());
        Asteroid asteroid = asteroids.get(0);
        assertEquals("2101955", asteroid.getNasaId());
        assertEquals("101955 Bennu", asteroid.getName());
        assertEquals(0.2, asteroid.getEstimatedDiameterMinKm());
        assertEquals(0.4, asteroid.getEstimatedDiameterMaxKm());
        assertTrue(asteroid.getIsPotentiallyHazardous());

        assertEquals(1, asteroid.getCloseApproaches().size());
        CloseApproach approach = asteroid.getCloseApproaches().get(0);
        assertSame(asteroid, approach.getAsteroid());
        assertEquals(LocalDate.of(2026, 8, 22), approach.getApproachDate());
        // miss_distance/relative_velocity arrive as numeric strings, not JSON numbers
        assertEquals(1234.56, approach.getMissDistanceKm());
        assertEquals(50000.5, approach.getRelativeVelocityKmh());
        assertEquals("Earth", approach.getOrbitingBody());
    }

    @Test
    void flattensAsteroidsAcrossMultipleDatesAndMultipleApproaches() {
        NasaClient nasaClient = spy(new NasaClient());
        doReturn("""
                {
                  "near_earth_objects": {
                    "2026-08-22": [
                      { "id": "1", "name": "A", "estimated_diameter": { "kilometers": {} },
                        "is_potentially_hazardous_asteroid": false, "close_approach_data": [] }
                    ],
                    "2026-08-23": [
                      { "id": "2", "name": "B", "estimated_diameter": { "kilometers": {} },
                        "is_potentially_hazardous_asteroid": false,
                        "close_approach_data": [
                          { "close_approach_date": "2026-08-23", "miss_distance": { "kilometers": "1" },
                            "relative_velocity": { "kilometers_per_hour": "1" }, "orbiting_body": "Earth" },
                          { "close_approach_date": "2026-08-24", "miss_distance": { "kilometers": "2" },
                            "relative_velocity": { "kilometers_per_hour": "2" }, "orbiting_body": "Earth" }
                        ] }
                    ]
                  }
                }
                """).when(nasaClient).fetchTodayFeed();

        List<Asteroid> asteroids = nasaClient.fetchTodayAsteroids();

        assertEquals(2, asteroids.size());
        Asteroid withApproaches = asteroids.stream().filter(a -> a.getNasaId().equals("2")).findFirst().orElseThrow();
        assertEquals(2, withApproaches.getCloseApproaches().size());
    }

    @Test
    void missingFieldsDefaultInsteadOfThrowing() {
        NasaClient nasaClient = spy(new NasaClient());
        // No estimated_diameter or close_approach_data at all — NASA's .path() based parsing
        // should default these to 0.0/empty rather than blowing up the whole ingest
        doReturn("""
                {
                  "near_earth_objects": {
                    "2026-08-22": [
                      { "id": "3", "name": "C", "is_potentially_hazardous_asteroid": false }
                    ]
                  }
                }
                """).when(nasaClient).fetchTodayFeed();

        List<Asteroid> asteroids = nasaClient.fetchTodayAsteroids();

        assertEquals(1, asteroids.size());
        Asteroid asteroid = asteroids.get(0);
        assertEquals(0.0, asteroid.getEstimatedDiameterMinKm());
        assertEquals(0.0, asteroid.getEstimatedDiameterMaxKm());
        assertTrue(asteroid.getCloseApproaches().isEmpty());
    }
}
