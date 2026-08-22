package com.abdullah.neowatch.repository;

import com.abdullah.neowatch.model.CloseApproach;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CloseApproachRepository extends JpaRepository<CloseApproach, Long> {
    // Derived query: Spring Data builds "where asteroid_id = ?" from the method name
    List<CloseApproach> findByAsteroidId(Long asteroidId);
}
