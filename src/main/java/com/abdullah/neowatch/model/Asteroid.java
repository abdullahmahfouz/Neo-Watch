package com.abdullah.neowatch.model;

import jakarta.persistence.*;
import lombok.Data;

// Persisted row for one near-earth object ingested from NASA's feed. @Data (Lombok) generates
// getters/setters/equals/hashCode/toString at compile time.
@Entity
@Data
public class Asteroid {
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
}
