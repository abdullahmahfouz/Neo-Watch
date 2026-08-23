package com.abdullah.neowatch.service;

import com.abdullah.neowatch.client.NasaClient;
import com.abdullah.neowatch.model.Asteroid;
import com.abdullah.neowatch.model.CloseApproach;
import com.abdullah.neowatch.model.RiskSnapshot;
import com.abdullah.neowatch.repository.AsteroidRepository;
import com.abdullah.neowatch.repository.CloseApproachRepository;
import com.abdullah.neowatch.repository.RiskSnapshotRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

// calculateRiskScore() is pure and needs no mocks; everything else touches the NASA client or a
// repository, so those methods are exercised with Mockito mocks instead of a real Spring context.
@ExtendWith(MockitoExtension.class)
class AsteroidServiceTest {

    @Mock
    private NasaClient nasaClient;
    @Mock
    private AsteroidRepository asteroidRepository;
    @Mock
    private CloseApproachRepository closeApproachRepository;
    @Mock
    private RiskSnapshotRepository riskSnapshotRepository;

    private AsteroidService newService() {
        return new AsteroidService(nasaClient, asteroidRepository, closeApproachRepository, riskSnapshotRepository);
    }

    @Test
    void closerAndFasterMeansHigherRisk() {
        AsteroidService asteroidService = newService();
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
        AsteroidService asteroidService = newService();
        Asteroid asteroid = new Asteroid();
        asteroid.setEstimatedDiameterMinKm(1.0);
        asteroid.setEstimatedDiameterMaxKm(3.0); // average = 2.0

        CloseApproach closeApproach = new CloseApproach();
        closeApproach.setRelativeVelocityKmh(10_000.0);
        closeApproach.setMissDistanceKm(500.0);

        // (2.0 * 10_000) / 500 = 40.0
        assertEquals(40.0, asteroidService.calculateRiskScore(asteroid, closeApproach));
    }

    // Builds one fetched Asteroid (as NasaClient.fetchTodayAsteroids() would return it) with a
    // single close approach attached, ready to feed into ingestTodayAsteroids().
    private Asteroid fetchedAsteroidWithApproach(String nasaId, LocalDate approachDate) {
        Asteroid fetched = new Asteroid();
        fetched.setNasaId(nasaId);
        fetched.setName("Bennu");
        fetched.setEstimatedDiameterMinKm(0.2);
        fetched.setEstimatedDiameterMaxKm(0.4);
        fetched.setIsPotentiallyHazardous(true);

        CloseApproach approach = new CloseApproach();
        approach.setAsteroid(fetched);
        approach.setApproachDate(approachDate);
        approach.setMissDistanceKm(10_000.0);
        approach.setRelativeVelocityKmh(50_000.0);
        approach.setOrbitingBody("Earth");
        fetched.getCloseApproaches().add(approach);

        return fetched;
    }

    @Test
    void ingestInsertsNewAsteroidAndRecordsARiskSnapshot() {
        AsteroidService asteroidService = newService();
        LocalDate approachDate = LocalDate.of(2026, 8, 22);
        Asteroid fetched = fetchedAsteroidWithApproach("2101955", approachDate);

        when(nasaClient.fetchTodayAsteroids()).thenReturn(List.of(fetched));
        when(asteroidRepository.findByNasaId("2101955")).thenReturn(Optional.empty());
        when(asteroidRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(closeApproachRepository.findByAsteroidAndApproachDate(any(), any())).thenReturn(Optional.empty());
        when(closeApproachRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        List<Asteroid> saved = asteroidService.ingestTodayAsteroids();

        assertEquals(1, saved.size());
        assertEquals("2101955", saved.get(0).getNasaId());
        assertEquals("Bennu", saved.get(0).getName());

        ArgumentCaptor<RiskSnapshot> snapshotCaptor = ArgumentCaptor.forClass(RiskSnapshot.class);
        verify(riskSnapshotRepository).save(snapshotCaptor.capture());
        // (avg diameter 0.3 * velocity 50_000) / distance 10_000 = 1.5
        assertEquals(1.5, snapshotCaptor.getValue().getRiskScore(), 0.0001);
    }

    @Test
    void ingestUpdatesExistingAsteroidInsteadOfInsertingADuplicate() {
        AsteroidService asteroidService = newService();
        LocalDate approachDate = LocalDate.of(2026, 8, 22);
        Asteroid fetched = fetchedAsteroidWithApproach("2101955", approachDate);

        Asteroid existing = new Asteroid();
        existing.setId(42L);
        existing.setNasaId("2101955");

        when(nasaClient.fetchTodayAsteroids()).thenReturn(List.of(fetched));
        when(asteroidRepository.findByNasaId("2101955")).thenReturn(Optional.of(existing));
        when(asteroidRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(closeApproachRepository.findByAsteroidAndApproachDate(any(), any())).thenReturn(Optional.empty());
        when(closeApproachRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        List<Asteroid> saved = asteroidService.ingestTodayAsteroids();

        assertEquals(1, saved.size());
        assertEquals(42L, saved.get(0).getId());
        assertEquals("Bennu", saved.get(0).getName());
        verify(asteroidRepository, times(1)).save(any());
    }

    @Test
    void ingestUpdatesExistingApproachInsteadOfInsertingADuplicate() {
        AsteroidService asteroidService = newService();
        LocalDate approachDate = LocalDate.of(2026, 8, 22);
        Asteroid fetched = fetchedAsteroidWithApproach("2101955", approachDate);

        CloseApproach existingApproach = new CloseApproach();
        existingApproach.setId(7L);

        when(nasaClient.fetchTodayAsteroids()).thenReturn(List.of(fetched));
        when(asteroidRepository.findByNasaId("2101955")).thenReturn(Optional.empty());
        when(asteroidRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(closeApproachRepository.findByAsteroidAndApproachDate(any(), any())).thenReturn(Optional.of(existingApproach));
        when(closeApproachRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        asteroidService.ingestTodayAsteroids();

        ArgumentCaptor<CloseApproach> approachCaptor = ArgumentCaptor.forClass(CloseApproach.class);
        verify(closeApproachRepository).save(approachCaptor.capture());
        assertEquals(7L, approachCaptor.getValue().getId());
        assertEquals(approachDate, approachCaptor.getValue().getApproachDate());
    }

    @Test
    void getHazardousAsteroidsDelegatesToTheRepository() {
        AsteroidService asteroidService = newService();
        List<Asteroid> hazardous = List.of(new Asteroid());
        when(asteroidRepository.findByIsPotentiallyHazardousTrue()).thenReturn(hazardous);

        assertSame(hazardous, asteroidService.getHazardousAsteroids());
    }

    @Test
    void getUpcomingAsteroidsQueriesASevenDayWindowFromToday() {
        AsteroidService asteroidService = newService();
        List<Asteroid> upcoming = List.of(new Asteroid());
        when(asteroidRepository.findWithApproachBetween(any(), any())).thenReturn(upcoming);

        List<Asteroid> result = asteroidService.getUpcomingAsteroids();

        assertSame(upcoming, result);
        ArgumentCaptor<LocalDate> startCaptor = ArgumentCaptor.forClass(LocalDate.class);
        ArgumentCaptor<LocalDate> endCaptor = ArgumentCaptor.forClass(LocalDate.class);
        verify(asteroidRepository).findWithApproachBetween(startCaptor.capture(), endCaptor.capture());
        assertEquals(startCaptor.getValue().plusDays(7), endCaptor.getValue());
    }

    @Test
    void getApproachHistoryDelegatesToTheRepository() {
        AsteroidService asteroidService = newService();
        List<CloseApproach> history = List.of(new CloseApproach());
        when(closeApproachRepository.findByAsteroidId(1L)).thenReturn(history);

        assertSame(history, asteroidService.getApproachHistory(1L));
    }

    @Test
    void getRiskScoreReturnsTheRiskiestOfMultipleApproaches() {
        AsteroidService asteroidService = newService();
        Asteroid asteroid = new Asteroid();
        asteroid.setEstimatedDiameterMinKm(1.0);
        asteroid.setEstimatedDiameterMaxKm(1.0);

        CloseApproach farApproach = new CloseApproach();
        farApproach.setRelativeVelocityKmh(1_000.0);
        farApproach.setMissDistanceKm(10_000.0); // risk = 0.1

        CloseApproach closeApproach = new CloseApproach();
        closeApproach.setRelativeVelocityKmh(1_000.0);
        closeApproach.setMissDistanceKm(100.0); // risk = 10.0

        when(asteroidRepository.findById(1L)).thenReturn(Optional.of(asteroid));
        when(closeApproachRepository.findByAsteroidId(1L)).thenReturn(List.of(farApproach, closeApproach));

        assertEquals(10.0, asteroidService.getRiskScore(1L));
    }

    @Test
    void getRiskScoreThrowsWhenTheAsteroidDoesNotExist() {
        AsteroidService asteroidService = newService();
        when(asteroidRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> asteroidService.getRiskScore(99L));
        verify(closeApproachRepository, never()).findByAsteroidId(anyLong());
    }

    @Test
    void getRiskHistoryDelegatesToTheRepository() {
        AsteroidService asteroidService = newService();
        List<RiskSnapshot> history = List.of(new RiskSnapshot());
        when(riskSnapshotRepository.findByAsteroidIdOrderByCalculatedAtAsc(1L)).thenReturn(history);

        assertSame(history, asteroidService.getRiskHistory(1L));
    }
}
