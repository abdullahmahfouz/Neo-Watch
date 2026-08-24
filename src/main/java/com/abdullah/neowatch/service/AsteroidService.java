package com.abdullah.neowatch.service;

import com.abdullah.neowatch.client.NasaClient;
import com.abdullah.neowatch.dto.DashboardRow;
import com.abdullah.neowatch.model.Asteroid;
import com.abdullah.neowatch.model.CloseApproach;
import com.abdullah.neowatch.model.RiskSnapshot;
import com.abdullah.neowatch.repository.AsteroidRepository;
import com.abdullah.neowatch.repository.CloseApproachRepository;
import com.abdullah.neowatch.repository.RiskSnapshotRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Objects;

// Coordinates fetching the current NEO feed from NASA (NasaClient) and persisting it
// (AsteroidRepository, CloseApproachRepository, RiskSnapshotRepository); kept thin on purpose
// so NasaClient stays a pure API client.
@Service
public class AsteroidService {

    // How far back close approaches (and their risk snapshots) are kept before pruneOldData()
    // removes them — matches the rolling window NASA's own feed returns (see
    // NasaClient.fetchTodayFeed), so retained data never outlives what a re-ingest could recover
    private static final int RETENTION_DAYS = 7;

    // Bulk-density estimate for a stony (S-type) near-Earth asteroid, used because NASA's NeoWs
    // feed gives diameter but not composition or mass. 3,000 kg/m^3 sits in the middle of the
    // commonly cited 1,300-3,500 kg/m^3 range for S-type NEOs (Britt et al. 2002) — a documented
    // assumption, not a measured value for any specific object.
    private static final double ASSUMED_DENSITY_KG_M3 = 3000.0;

    // 1 megaton of TNT = 4.184e15 J (standard conversion, also used by NASA/JPL when quoting
    // impact energy in TNT-equivalent terms).
    private static final double JOULES_PER_MEGATON_TNT = 4.184e15;

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
    // server's default timezone, so the data stays fresh without anyone hitting /ingest by hand.
    // Clears every read cache below, since this is the only method that ever changes the data —
    // otherwise a cached response could keep serving pre-ingest values after new data lands.
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    @CacheEvict(value = {"hazardousAsteroids", "upcomingAsteroids", "approachHistory", "impactEnergy",
            "impactEnergyHistory", "dashboardRows"}, allEntries = true)
    public List<Asteroid> ingestTodayAsteroids() {
        List<Asteroid> fetchedAsteroids = nasaClient.fetchTodayAsteroids();

        List<Asteroid> savedAsteroids = new ArrayList<>();
        for (Asteroid fetched : fetchedAsteroids) {
            Asteroid asteroid = upsertAsteroid(fetched);
            for (CloseApproach fetchedApproach : fetched.getCloseApproaches()) {
                CloseApproach closeApproach = upsertCloseApproach(asteroid, fetchedApproach);
                recordImpactEnergySnapshot(asteroid, closeApproach);
            }
            savedAsteroids.add(asteroid);
        }

        // Only prune once we know this ingest actually brought in fresh data — NasaClient
        // returns an empty list (rather than throwing) for a degraded-but-200 upstream response,
        // and pruning on top of that would erase 7-day-old history with nothing to replace it.
        if (!savedAsteroids.isEmpty()) {
            pruneOldData();
        }

        return savedAsteroids;
    }

    // Deletes close approaches (and their risk snapshots) once they fall outside the retention
    // window. Without this, both tables grow without bound: CloseApproach because NASA's feed
    // silently rolls old approaches out of scope rather than telling us to delete them, and
    // RiskSnapshot even faster since a fresh snapshot is appended on every ingest with no dedup
    // (see recordImpactEnergySnapshot). Snapshots must be deleted first — RiskSnapshot holds the FK to
    // CloseApproach, so deleting approaches first would fail.
    private void pruneOldData() {
        LocalDate cutoff = LocalDate.now().minusDays(RETENTION_DAYS);
        riskSnapshotRepository.deleteByCloseApproach_ApproachDateBefore(cutoff);
        closeApproachRepository.deleteByApproachDateBefore(cutoff);
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
    // per ingest is what lets getImpactEnergyHistory() show a trend over time instead of one
    // live number
    private void recordImpactEnergySnapshot(Asteroid asteroid, CloseApproach closeApproach) {
        RiskSnapshot snapshot = new RiskSnapshot();
        snapshot.setAsteroid(asteroid);
        snapshot.setCloseApproach(closeApproach);
        snapshot.setImpactEnergyMt(calculateImpactEnergyMt(asteroid, closeApproach));
        snapshot.setCalculatedAt(LocalDateTime.now());
        riskSnapshotRepository.save(snapshot);
    }

    @Cacheable("hazardousAsteroids")
    public List<Asteroid> getHazardousAsteroids() {
        return asteroidRepository.findByIsPotentiallyHazardousTrue();
    }

    @Cacheable("upcomingAsteroids")
    public List<Asteroid> getUpcomingAsteroids() {
        LocalDate today = LocalDate.now();
        return asteroidRepository.findWithApproachBetween(today, today.plusDays(7));
    }

    @Cacheable(value = "approachHistory", key = "#asteroidId")
    public List<CloseApproach> getApproachHistory(Long asteroidId) {
        return closeApproachRepository.findByAsteroidId(asteroidId);
    }

    // Impact energy estimate (megatons of TNT equivalent), via the standard kinetic-energy
    // formula E = 1/2 * m * v^2. Unlike the old diameter*velocity/distance heuristic, this uses
    // a verified physics formula for the energy term itself — the only estimate left is mass,
    // derived from diameter via ASSUMED_DENSITY_KG_M3 since NASA's feed gives diameter but not
    // composition or mass. Deliberately ignores miss distance: kinetic energy is a property of
    // the object and its speed, not of how close any one recorded pass happened to be. This is
    // still an estimate, not a real impact probability — that would require orbit-uncertainty
    // data (e.g. NASA/JPL's Sentry system) that NeoWs close-approach data doesn't provide.
    //
    // Returns null (rather than throwing, or silently substituting a fabricated number) when the
    // inputs can't support a physically meaningful answer: a missing diameter/velocity, or a
    // negative diameter/velocity, which NASA's feed never actually sends but a hand-built
    // Asteroid/CloseApproach (tests, future callers) could. A zero velocity is physically valid
    // (zero relative speed means zero kinetic energy in this frame) and returns 0.0, not null.
    public Double calculateImpactEnergyMt(Asteroid asteroid, CloseApproach closeApproach) {
        Double diameterMinKm = asteroid.getEstimatedDiameterMinKm();
        Double diameterMaxKm = asteroid.getEstimatedDiameterMaxKm();
        Double velocityKmh = closeApproach.getRelativeVelocityKmh();

        if (diameterMinKm == null || diameterMaxKm == null || velocityKmh == null) {
            return null;
        }
        if (diameterMinKm < 0 || diameterMaxKm < 0 || velocityKmh < 0) {
            return null;
        }

        double avgDiameterKm = (diameterMinKm + diameterMaxKm) / 2;
        double radiusM = (avgDiameterKm * 1000) / 2;
        double volumeM3 = (4.0 / 3.0) * Math.PI * Math.pow(radiusM, 3);
        double massKg = ASSUMED_DENSITY_KG_M3 * volumeM3;

        double velocityMs = velocityKmh * 1000 / 3600;
        double energyJoules = 0.5 * massKg * velocityMs * velocityMs;
        double energyMt = energyJoules / JOULES_PER_MEGATON_TNT;

        // Guards against NaN/Infinity ever reaching a caller (and, downstream, the frontend) —
        // shouldn't happen for any realistic NEO, but an absurd hand-built input (e.g. a diameter
        // near Double.MAX_VALUE) could overflow the cubic volume term.
        return Double.isFinite(energyMt) ? energyMt : null;
    }

    // Reports the highest-energy approach on record for this asteroid, since NASA can refine
    // relativeVelocityKmh for the same approach between ingests, and different approaches can
    // be recorded at different speeds. Approaches calculateImpactEnergyMt() can't compute a
    // value for (missing/invalid inputs) are skipped rather than crashing the whole request.
    @Cacheable(value = "impactEnergy", key = "#asteroidId")
    public double getImpactEnergyMt(Long asteroidId) {
        Asteroid asteroid = asteroidRepository.findById(asteroidId)
                .orElseThrow(() -> new NoSuchElementException("Asteroid not found: " + asteroidId));
        List<CloseApproach> approaches = closeApproachRepository.findByAsteroidId(asteroidId);

        return approaches.stream()
                .map(closeApproach -> calculateImpactEnergyMt(asteroid, closeApproach))
                .filter(Objects::nonNull)
                .mapToDouble(Double::doubleValue)
                .max()
                .orElse(0.0);
    }

    // Oldest-to-newest impact energy estimates recorded for this asteroid across every past
    // ingest — the trend line, as opposed to getImpactEnergyMt()'s single live "highest-energy
    // approach right now"
    @Cacheable(value = "impactEnergyHistory", key = "#asteroidId")
    public List<RiskSnapshot> getImpactEnergyHistory(Long asteroidId) {
        return riskSnapshotRepository.findByAsteroidIdOrderByCalculatedAtAsc(asteroidId);
    }

    // Everything the dashboard needs (union of upcoming + hazardous, each joined to its
    // next-relevant approach and current impact energy estimate) in one call, instead of the
    // frontend making a separate history + energy request per asteroid.
    //
    // Queries the repositories directly rather than calling getUpcomingAsteroids() /
    // getHazardousAsteroids() / getApproachHistory() / getImpactEnergyMt() on `this` — self-
    // invocation within the same bean bypasses Spring's proxy, so those methods'
    // @Cacheable would silently never fire if called from here. Fetching each asteroid's
    // approaches once and reusing that same list for both the next-approach pick and the
    // impact energy estimate also avoids getImpactEnergyMt()'s redundant re-fetch of the same
    // data.
    @Cacheable("dashboardRows")
    public List<DashboardRow> getDashboardRows() {
        LocalDate today = LocalDate.now();

        Map<Long, Asteroid> byId = new LinkedHashMap<>();
        for (Asteroid asteroid : asteroidRepository.findWithApproachBetween(today, today.plusDays(7))) {
            byId.put(asteroid.getId(), asteroid);
        }
        for (Asteroid asteroid : asteroidRepository.findByIsPotentiallyHazardousTrue()) {
            byId.put(asteroid.getId(), asteroid);
        }

        List<DashboardRow> rows = new ArrayList<>();
        for (Asteroid asteroid : byId.values()) {
            List<CloseApproach> approaches = closeApproachRepository.findByAsteroidId(asteroid.getId());

            CloseApproach nextApproach = approaches.stream()
                    .sorted(Comparator.comparing(CloseApproach::getApproachDate))
                    .filter(a -> !a.getApproachDate().isBefore(today))
                    .findFirst()
                    .orElseGet(() -> approaches.stream()
                            .max(Comparator.comparing(CloseApproach::getApproachDate))
                            .orElse(null));

            double impactEnergyMt = approaches.stream()
                    .map(closeApproach -> calculateImpactEnergyMt(asteroid, closeApproach))
                    .filter(Objects::nonNull)
                    .mapToDouble(Double::doubleValue)
                    .max()
                    .orElse(0.0);

            rows.add(new DashboardRow(asteroid, nextApproach, impactEnergyMt));
        }
        return rows;
    }
}
