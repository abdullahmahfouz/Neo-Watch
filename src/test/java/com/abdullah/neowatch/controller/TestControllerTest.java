package com.abdullah.neowatch.controller;

import com.abdullah.neowatch.client.NasaClient;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TestController.class)
@Import(NoOpCacheManagerConfig.class)
class TestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private NasaClient nasaClient;

    @Test
    void returnsTheRawFeedJsonUnmodified() throws Exception {
        when(nasaClient.fetchTodayFeed()).thenReturn("{\"raw\":true}");

        mockMvc.perform(get("/test-nasa"))
                .andExpect(status().isOk())
                .andExpect(content().json("{\"raw\":true}"));
    }
}
