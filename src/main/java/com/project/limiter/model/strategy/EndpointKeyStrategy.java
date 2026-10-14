package com.project.limiter.model.strategy;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonTypeName;
import lombok.*;

@JsonTypeName("ENDPOINT")
@Getter
@Setter
@NoArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class EndpointKeyStrategy implements KeyStrategyConfig {

    @Override
    public String resolveKey(RateLimitContext ctx) {
        return ctx != null && ctx.getEndpoint() != null && !ctx.getEndpoint().isBlank()
                ? "endpoint:" + ctx.getEndpoint()
                : "endpoint:generic";
    }
}
