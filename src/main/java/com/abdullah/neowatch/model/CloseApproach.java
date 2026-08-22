package com.abdullah.neowatch.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

// One recorded close-approach event for an asteroid, parsed from NASA's close_approach_data array
@Entity
@Data
public class CloseApproach {
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
