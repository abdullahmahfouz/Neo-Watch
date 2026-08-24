package com.abdullah.neowatch.model;

import jakarta.persistence.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

// An impact energy estimate (megatons of TNT equivalent) computed at one point in time for one
// close approach. A new snapshot is recorded on every ingest (see AsteroidService), even for an
// approach seen before, so a series of these for the same asteroid traces how the estimate has
// moved across ingests (it can change between ingests because relativeVelocityKmh is refined as
// NASA updates its orbit solution). Implements Serializable so it can be stored in the Redis
// cache (see AsteroidService).
@Entity
@Data
public class RiskSnapshot implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Asteroid asteroid;

    @ManyToOne
    private CloseApproach closeApproach;

    private Double impactEnergyMt;
    private LocalDateTime calculatedAt;
}
