package com.abdullah.neowatch;

import org.springframework.boot.SpringApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

// Entry point: enables component scanning, autoconfiguration, and config properties for
// everything under com.abdullah.neowatch. @EnableScheduling turns on the @Scheduled midnight
// ingest job in AsteroidService.
@org.springframework.boot.autoconfigure.SpringBootApplication
@EnableScheduling
public class NeowatchApplication {

	public static void main(String[] args) {
		SpringApplication.run(NeowatchApplication.class, args);
	}

}
