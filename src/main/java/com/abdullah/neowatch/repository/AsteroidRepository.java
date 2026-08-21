package com.abdullah.neowatch.repository;

import com.abdullah.neowatch.model.Asteroid;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AsteroidRepository extends JpaRepository<Asteroid, Long> {
}
