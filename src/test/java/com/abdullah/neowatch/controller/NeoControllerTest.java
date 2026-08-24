package com.abdullah.neowatch.controller;

import com.abdullah.neowatch.model.Asteroid;
import com.abdullah.neowatch.model.CloseApproach;
import com.abdullah.neowatch.model.RiskSnapshot;
import com.abdullah.neowatch.service.AsteroidService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Slice test: only NeoController + Spring MVC infrastructure are loaded, with AsteroidService
// mocked out — no DB, no NASA calls, no other controllers.
@WebMvcTest(NeoController.class)
@Import(NoOpCacheManagerConfig.class)
class NeoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AsteroidService asteroidService;

    @Test
    void upcomingReturnsWhateverTheServiceReturns() throws Exception {
        Asteroid asteroid = new Asteroid();
        asteroid.setId(1L);
        asteroid.setName("Bennu");
        when(asteroidService.getUpcomingAsteroids()).thenReturn(List.of(asteroid));

        mockMvc.perform(get("/api/neo/upcoming"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("Bennu"));
    }

    @Test
    void hazardousReturnsWhateverTheServiceReturns() throws Exception {
        Asteroid asteroid = new Asteroid();
        asteroid.setId(2L);
        asteroid.setIsPotentiallyHazardous(true);
        when(asteroidService.getHazardousAsteroids()).thenReturn(List.of(asteroid));

        mockMvc.perform(get("/api/neo/hazardous"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(2))
                .andExpect(jsonPath("$[0].isPotentiallyHazardous").value(true));
    }

    @Test
    void historyDelegatesTheIdFromThePathToTheService() throws Exception {
        CloseApproach approach = new CloseApproach();
        approach.setOrbitingBody("Earth");
        when(asteroidService.getApproachHistory(eq(5L))).thenReturn(List.of(approach));

        mockMvc.perform(get("/api/neo/5/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].orbitingBody").value("Earth"));
    }

    @Test
    void impactEnergyReturnsARawNumber() throws Exception {
        when(asteroidService.getImpactEnergyMt(eq(5L))).thenReturn(12.5);

        mockMvc.perform(get("/api/neo/5/impact-energy"))
                .andExpect(status().isOk())
                .andExpect(content().string("12.5"));
    }

    @Test
    void impactEnergyHistoryDelegatesTheIdFromThePathToTheService() throws Exception {
        RiskSnapshot snapshot = new RiskSnapshot();
        snapshot.setImpactEnergyMt(3.0);
        when(asteroidService.getImpactEnergyHistory(eq(5L))).thenReturn(List.of(snapshot));

        mockMvc.perform(get("/api/neo/5/impact-energy-history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].impactEnergyMt").value(3.0));
    }
}
