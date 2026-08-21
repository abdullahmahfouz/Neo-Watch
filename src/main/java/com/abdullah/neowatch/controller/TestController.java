package com.abdullah.neowatch.controller;

import com.abdullah.neowatch.client.NasaClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

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
