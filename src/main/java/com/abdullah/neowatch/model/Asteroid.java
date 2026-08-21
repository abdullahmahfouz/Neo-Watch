package com.abdullah.neowatch.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Asteroid {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nasaId;
    private String name;
    private Double estimatedDiameterMinKm;
    private Double estimatedDiameterMaxKm;
    private Boolean isPotentiallyHazardous;
}
