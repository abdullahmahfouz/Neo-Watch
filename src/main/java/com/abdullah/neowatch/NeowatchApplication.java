package com.abdullah.neowatch;

import org.springframework.boot.SpringApplication;

// Entry point: enables component scanning, autoconfiguration, and config properties for
// everything under com.abdullah.neowatch
@org.springframework.boot.autoconfigure.SpringBootApplication
public class NeowatchApplication {

	public static void main(String[] args) {
		SpringApplication.run(NeowatchApplication.class, args);
	}

}
