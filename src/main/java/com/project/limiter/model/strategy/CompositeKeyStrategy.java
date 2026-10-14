package com.project.limiter.model.strategy;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonTypeName;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@JsonTypeName("COMPOSITE")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class CompositeKeyStrategy implements KeyStrategyConfig {

    @JsonProperty("fields")
    @JsonAlias({"custom", "components", "enums", "compositeFields"})
    @Builder.Default
    private List<String> fields = new ArrayList<>();

    @JsonProperty("strategies")
    @Builder.Default
    private List<KeyStrategyConfig> strategies = new ArrayList<>();

    @Override
    public String resolveKey(RateLimitContext ctx) {
        List<String> parts = new ArrayList<>();

        if (fields != null && !fields.isEmpty()) {
            for (String field : fields) {
                if (field == null) continue;
                String normalized = field.trim().toUpperCase();
                switch (normalized) {
                    case "USER":
                    case "USER_ID":
                    case "USERID":
                        parts.add(ctx != null && ctx.getUserId() != null && !ctx.getUserId().isBlank()
                                ? "user:" + ctx.getUserId()
                                : "user:anonymous");
                        break;
                    case "IP":
                    case "CLIENT_IP":
                    case "CLIENTIP":
                        parts.add(ctx != null && ctx.getClientIp() != null && !ctx.getClientIp().isBlank()
                                ? "ip:" + ctx.getClientIp()
                                : "ip:unknown");
                        break;
                    case "ENDPOINT":
                    case "API_NAME":
                    case "APINAME":
                    case "ROUTE":
                        parts.add(ctx != null && ctx.getEndpoint() != null && !ctx.getEndpoint().isBlank()
                                ? "endpoint:" + ctx.getEndpoint()
                                : "endpoint:generic");
                        break;
                    default:
                        parts.add(normalized.toLowerCase() + ":unknown");
                        break;
                }
            }
        }

        if (strategies != null && !strategies.isEmpty()) {
            for (KeyStrategyConfig strategy : strategies) {
                if (strategy != null) {
                    parts.add(strategy.resolveKey(ctx));
                }
            }
        }

        if (parts.isEmpty()) {
            return "composite:empty";
        }

        return String.join(":", parts);
    }
}
