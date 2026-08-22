package com.abdullah.neowatch;

import org.springframework.boot.SpringApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

// Entry point: enables component scanning, autoconfiguration, and config properties for
// everything under com.abdullah.neowatch. @EnableScheduling turns on the @Scheduled midnight
// ingest job in AsteroidService; @EnableCaching turns on its @Cacheable/@CacheEvict methods,
// backed by Redis (spring-boot-starter-data-redis auto-configures the CacheManager).
@org.springframework.boot.autoconfigure.SpringBootApplication
@EnableScheduling
@EnableCaching
public class NeowatchApplication {

	public static void main(String[] args) {
		SpringApplication.run(NeowatchApplication.class, args);
	}

}
