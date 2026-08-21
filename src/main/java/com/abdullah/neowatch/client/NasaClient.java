package com.abdullah.neowatch.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class NasaClient {

    @Value("${nasa.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public String fetchTodayFeed() {
        String url = "https://api.nasa.gov/neo/rest/v1/feed?api_key=" + apiKey;
        return restTemplate.getForObject(url, String.class);
    }
}
