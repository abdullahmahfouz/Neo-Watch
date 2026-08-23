package com.abdullah.neowatch.controller;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.cache.CacheManager;
import org.springframework.cache.support.NoOpCacheManager;
import org.springframework.context.annotation.Bean;

// @WebMvcTest boots NeowatchApplication's config, which carries @EnableCaching — Spring's cache
// infrastructure needs a CacheManager bean at context startup even when the slice never actually
// invokes a @Cacheable method, so this satisfies that with a no-op stand-in.
@TestConfiguration
class NoOpCacheManagerConfig {

    @Bean
    CacheManager cacheManager() {
        return new NoOpCacheManager();
    }
}
