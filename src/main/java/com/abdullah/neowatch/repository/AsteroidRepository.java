package com.abdullah.neowatch.repository;

import com.abdullah.neowatch.model.Asteroid;
import org.springframework.data.jpa.repository.JpaRepository;

// No custom queries yet; JpaRepository already provides save/saveAll/findById/findAll/delete
// via Spring Data's generated implementation
public interface AsteroidRepository extends JpaRepository<Asteroid, Long> {
}
