package com.project.limiter.model.strategy;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "type"
)
@JsonSubTypes({
    @JsonSubTypes.Type(value = UserKeyStrategy.class, name = "USER"),
    @JsonSubTypes.Type(value = UserKeyStrategy.class, name = "USER_ID"),
    @JsonSubTypes.Type(value = IpKeyStrategy.class, name = "IP"),
    @JsonSubTypes.Type(value = EndpointKeyStrategy.class, name = "ENDPOINT"),
    @JsonSubTypes.Type(value = EndpointKeyStrategy.class, name = "API_NAME"),
    @JsonSubTypes.Type(value = CompositeKeyStrategy.class, name = "COMPOSITE"),
    @JsonSubTypes.Type(value = CompositeKeyStrategy.class, name = "CUSTOM")
})
public interface KeyStrategyConfig {
    String resolveKey(RateLimitContext ctx);
}
