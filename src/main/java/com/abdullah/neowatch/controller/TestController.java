package com.abdullah.neowatch.controller;

import com.abdullah.neowatch.client.NasaClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

// Manual smoke-test endpoint for checking NASA API connectivity/credentials. Returns the raw
// feed JSON as-is; unlike /ingest (IngestController) it doesn't parse or persist anything.
@RestController
public class TestController {

    private final NasaClient nasaClient;

    public TestController(NasaClient nasaClient) {
        this.nasaClient = nasaClient;
    }

    @GetMapping("/test-nasa")
    public String testNasa() {
        return nasaClient.fetchTodayFeed();
    }
}
