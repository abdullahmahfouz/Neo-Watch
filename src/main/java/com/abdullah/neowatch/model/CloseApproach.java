package com.abdullah.neowatch.model;

import jakarta.persistence.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDate;

// One recorded close-approach event for an asteroid, parsed from NASA's close_approach_data
// array. Implements Serializable so it can be stored in the Redis cache (see AsteroidService).
@Entity
@Data
public class CloseApproach implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Asteroid asteroid;

    private LocalDate approachDate;
    private Double missDistanceKm;
    private Double relativeVelocityKmh;
    private String orbitingBody;
}
