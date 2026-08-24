package com.abdullah.neowatch.controller;

import java.util.List;

import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.abdullah.neowatch.model.Asteroid;
import com.abdullah.neowatch.service.AsteroidService;

@WebMvcTest(IngestController.class)
@Import(NoOpCacheManagerConfig.class)
@TestPropertySource(properties = "app.ingest-key=")
class IngestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AsteroidService asteroidService;

    @Test
    void ingestTriggersTheServiceAndReturnsWhatItSaved() throws Exception {
        Asteroid asteroid = new Asteroid();
        asteroid.setId(1L);
        asteroid.setNasaId("2101955");
        when(asteroidService.ingestTodayAsteroids()).thenReturn(List.of(asteroid));

        mockMvc.perform(get("/ingest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nasaId").value("2101955"));

        verify(asteroidService, times(1)).ingestTodayAsteroids();
    }
}
