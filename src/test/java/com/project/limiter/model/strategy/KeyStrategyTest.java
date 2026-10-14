package com.project.limiter.model.strategy;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class KeyStrategyTest {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void testUserKeyStrategy() throws Exception {
        UserKeyStrategy strategy = new UserKeyStrategy();
        RateLimitContext ctx = RateLimitContext.builder().userId("user-123").build();
        assertEquals("user:user-123", strategy.resolveKey(ctx));

        RateLimitContext emptyCtx = RateLimitContext.builder().build();
        assertEquals("user:anonymous", strategy.resolveKey(emptyCtx));
    }

    @Test
    void testIpKeyStrategy() throws Exception {
        IpKeyStrategy strategy = new IpKeyStrategy();
        RateLimitContext ctx = RateLimitContext.builder().clientIp("192.168.1.1").build();
        assertEquals("ip:192.168.1.1", strategy.resolveKey(ctx));

        RateLimitContext emptyCtx = RateLimitContext.builder().build();
        assertEquals("ip:unknown", strategy.resolveKey(emptyCtx));
    }

    @Test
    void testEndpointKeyStrategy() throws Exception {
        EndpointKeyStrategy strategy = new EndpointKeyStrategy();
        RateLimitContext ctx = RateLimitContext.builder().endpoint("/api/v1/checkout").build();
        assertEquals("endpoint:/api/v1/checkout", strategy.resolveKey(ctx));

        RateLimitContext emptyCtx = RateLimitContext.builder().build();
        assertEquals("endpoint:generic", strategy.resolveKey(emptyCtx));
    }

    @Test
    void testCompositeKeyStrategyWithFields() throws Exception {
        CompositeKeyStrategy strategy = CompositeKeyStrategy.builder()
                .fields(List.of("USER_ID", "IP", "ENDPOINT"))
                .build();

        RateLimitContext ctx = RateLimitContext.builder()
                .userId("cust-42")
                .clientIp("10.0.0.5")
                .endpoint("/orders")
                .build();

        assertEquals("user:cust-42:ip:10.0.0.5:endpoint:/orders", strategy.resolveKey(ctx));
    }

    @Test
    void testJacksonPolymorphismDeserialization() throws Exception {
        String jsonCustom = "{\"type\":\"CUSTOM\",\"fields\":[\"USER_ID\",\"IP\"]}";
        KeyStrategyConfig config = objectMapper.readValue(jsonCustom, KeyStrategyConfig.class);
        assertTrue(config instanceof CompositeKeyStrategy);
        CompositeKeyStrategy composite = (CompositeKeyStrategy) config;
        assertEquals(List.of("USER_ID", "IP"), composite.getFields());

        RateLimitContext ctx = RateLimitContext.builder()
                .userId("u1")
                .clientIp("1.2.3.4")
                .build();
        assertEquals("user:u1:ip:1.2.3.4", composite.resolveKey(ctx));

        String jsonEndpoint = "{\"type\":\"ENDPOINT\"}";
        KeyStrategyConfig endpointConfig = objectMapper.readValue(jsonEndpoint, KeyStrategyConfig.class);
        assertTrue(endpointConfig instanceof EndpointKeyStrategy);
    }
}
