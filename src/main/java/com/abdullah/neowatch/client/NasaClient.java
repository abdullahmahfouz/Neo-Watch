package com.abdullah.neowatch.client;

import com.abdullah.neowatch.model.Asteroid;
import com.abdullah.neowatch.model.CloseApproach;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

// Thin wrapper around NASA's NeoWs "feed" endpoint: fetchTodayFeed() returns the raw JSON,
// fetchTodayAsteroids() parses it into Asteroid entities ready for persistence.
@Component
public class NasaClient {

    @Value("${nasa.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Despite the name, NASA's /feed with no start_date/end_date returns a rolling 7-day window, not just today
    public String fetchTodayFeed() {
        String url = "https://api.nasa.gov/neo/rest/v1/feed?api_key=" + apiKey;
        return restTemplate.getForObject(url, String.class);
    }

    public List<Asteroid> fetchTodayAsteroids() {
        // readTree() throws unchecked JacksonException in Jackson 3 (unlike Jackson 2's checked
        // JsonProcessingException), so no try/catch is needed here
        JsonNode root = objectMapper.readTree(fetchTodayFeed());

        List<Asteroid> asteroids = new ArrayList<>();
        JsonNode neosByDate = root.path("near_earth_objects");
        for (Map.Entry<String, JsonNode> dateEntry : neosByDate.properties()) {
            for (JsonNode neo : dateEntry.getValue()) {
                Asteroid asteroid = new Asteroid();
                asteroid.setNasaId(neo.path("id").asText());
                asteroid.setName(neo.path("name").asText());

                // .path() (not .get()) returns a MissingNode instead of null/throwing if NASA
                // omits a field, so one malformed entry doesn't blow up the whole ingest
                JsonNode diameterKm = neo.path("estimated_diameter").path("kilometers");
                asteroid.setEstimatedDiameterMinKm(diameterKm.path("estimated_diameter_min").asDouble());
                asteroid.setEstimatedDiameterMaxKm(diameterKm.path("estimated_diameter_max").asDouble());

                asteroid.setIsPotentiallyHazardous(neo.path("is_potentially_hazardous_asteroid").asBoolean());

                // NASA sends miss_distance/relative_velocity as numeric strings (e.g. "1234.56"),
                // not JSON numbers — asDouble() parses those strings fine either way
                for (JsonNode approachNode : neo.path("close_approach_data")) {
                    CloseApproach closeApproach = new CloseApproach();
                    closeApproach.setAsteroid(asteroid);
                    closeApproach.setApproachDate(LocalDate.parse(approachNode.path("close_approach_date").asText()));
                    closeApproach.setMissDistanceKm(approachNode.path("miss_distance").path("kilometers").asDouble());
                    closeApproach.setRelativeVelocityKmh(approachNode.path("relative_velocity").path("kilometers_per_hour").asDouble());
                    closeApproach.setOrbitingBody(approachNode.path("orbiting_body").asText());
                    asteroid.getCloseApproaches().add(closeApproach);
                }

                asteroids.add(asteroid);
            }
        }
        return asteroids;
    }
}
