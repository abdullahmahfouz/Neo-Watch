package com.abdullah.neowatch.dto;

import com.abdullah.neowatch.model.Asteroid;
import com.abdullah.neowatch.model.CloseApproach;

import java.io.Serializable;

// Combines an asteroid, its next-relevant close approach, and its current impact energy
// estimate into one payload so the frontend can render the whole dashboard from a single
// request instead of one round trip per asteroid. See AsteroidService.getDashboardRows.
//
// Implements Serializable like Asteroid/CloseApproach/RiskSnapshot — this method is
// @Cacheable, and the Redis cache here stores values via Java serialization.
public record DashboardRow(Asteroid asteroid, CloseApproach approach, double impactEnergyMt) implements Serializable {
}
