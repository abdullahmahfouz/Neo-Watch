package com.abdullah.neowatch.model;

import jakarta.persistence.*;
import lombok.Data;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

// Persisted row for one near-earth object ingested from NASA's feed. @Data (Lombok) generates
// getters/setters/equals/hashCode/toString at compile time. Implements Serializable because
// Spring's Redis cache (see AsteroidService) stores cached values via Java serialization.
@Entity
@Data
public class Asteroid implements Serializable {
    // Local surrogate key, distinct from NASA's own id (nasaId below)
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // NASA's own identifier for this object, e.g. "2000433" — not currently unique-constrained,
    // so re-ingesting the feed creates duplicate rows rather than updating existing ones
    private String nasaId;
    private String name;
    private Double estimatedDiameterMinKm;
    private Double estimatedDiameterMaxKm;
    private Boolean isPotentiallyHazardous;

    // Not a DB column: CloseApproach owns the actual foreign key (see CloseApproach.asteroid).
    // This just carries the parsed approaches from NasaClient to AsteroidService so both can be
    // saved together in one ingest call.
    @Transient
    private List<CloseApproach> closeApproaches = new ArrayList<>();
}
