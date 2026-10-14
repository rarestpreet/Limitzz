import { Policy } from '../types/policy';

export type SupportedLanguage = 'javascript' | 'java' | 'python' | 'curl';

interface SnippetParams {
  policy: Policy;
  hostUrl: string;
  apiKey: string;
}

export function generateJavaScriptSnippet({ policy, hostUrl, apiKey }: SnippetParams): string {
  const strategy = policy.keyStrategy?.type || 'IP';
  const fields = (policy.keyStrategy?.fields || policy.keyStrategy?.custom || []) as string[];

  const needsUser = strategy === 'USER_ID' || strategy === 'USER' || fields.includes('USER_ID');
  const needsIp = strategy === 'IP' || fields.includes('IP');

  const payloadLines: string[] = [
    `      projectId: "${policy.projectId}",`,
    `      endpoint: "${policy.endpoint}",`,
  ];

  if (needsUser) {
    payloadLines.push(`      userId: req.user?.id || "usr_anonymous",`);
  }
  if (needsIp) {
    payloadLines.push(`      clientIp: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",`);
  }

  const endpointName = policy.name
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('') || 'Service';

  return `// ============================================================
// RLaaS Integration: ${policy.name}
// Endpoint: ${policy.endpoint}
// Key Strategy: ${strategy}${fields.length > 0 ? ` [${fields.join(' + ')}]` : ''}
// ============================================================

import fetch from 'node-fetch'; // Built-in in Node.js 18+

const RLAAS_URL = "${hostUrl}/v1/check";
const RLAAS_API_KEY = process.env.RLAAS_API_KEY || "${apiKey}";

/**
 * Controller/Middleware Guard for: ${policy.endpoint}
 */
export async function handle${endpointName}Request(req, res) {
  try {
    // 1. Evaluate rate limit with RLaaS before executing business logic
    const checkResponse = await fetch(RLAAS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": RLAAS_API_KEY,
      },
      body: JSON.stringify({
${payloadLines.join('\n')}
      }),
    });

    // 2. Handle Rate Limit Exceeded (HTTP 429)
    if (checkResponse.status === 429) {
      const retryAfter = checkResponse.headers.get("Retry-After") || "1";
      res.set("Retry-After", retryAfter);
      return res.status(429).json({
        error: "Too Many Requests",
        message: \`Rate limit quota exceeded. Please retry after \${retryAfter}s.\`,
      });
    }

    // Inspect remaining quota headers if needed
    const remaining = checkResponse.headers.get("X-RateLimit-Remaining");
    console.log(\`[RLaaS] Quota check passed. Remaining tokens: \${remaining}\`);

    // 3. Rate limit check passed -> Execute protected business logic
    return executeProtected${endpointName}Logic(req, res);

  } catch (error) {
    console.error("[RLaaS] Gateway check failed:", error);
    // Depending on fail-open policy fallback or internal error
    return res.status(500).json({ error: "Rate limiter verification error" });
  }
}

/**
 * Dummy protected business logic execution
 */
function executeProtected${endpointName}Logic(req, res) {
  // Your actual business execution logic here
  return res.json({
    success: true,
    data: "Protected business logic executed successfully for ${policy.endpoint}",
  });
}
`;
}

export function generateJavaSnippet({ policy, hostUrl, apiKey }: SnippetParams): string {
  const strategy = policy.keyStrategy?.type || 'IP';
  const fields = (policy.keyStrategy?.fields || policy.keyStrategy?.custom || []) as string[];

  const needsUser = strategy === 'USER_ID' || strategy === 'USER' || fields.includes('USER_ID');
  const needsIp = strategy === 'IP' || fields.includes('IP');

  const className = policy.name
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('') || 'RateLimit';

  // Build JSON text block and formatting arguments
  const jsonLines = [
    `              "projectId": "${policy.projectId}",`,
    `              "endpoint": "${policy.endpoint}",`,
  ];
  const formatArgs: string[] = [];

  if (needsUser) {
    jsonLines.push(`              "userId": "%s",`);
    formatArgs.push('resolveUserId(req)');
  }
  if (needsIp) {
    jsonLines.push(`              "clientIp": "%s",`);
    formatArgs.push('resolveClientIp(req)');
  }

  // Remove trailing comma from last line
  if (jsonLines.length > 0) {
    jsonLines[jsonLines.length - 1] = jsonLines[jsonLines.length - 1].replace(/,$/, '');
  }

  const formatCall = formatArgs.length > 0
    ? `\n                    ${formatArgs.join(',\n                    ')}`
    : '';

  return `// ============================================================
// RLaaS Integration: ${policy.name}
// Endpoint: ${policy.endpoint}
// Key Strategy: ${strategy}${fields.length > 0 ? ` [${fields.join(' + ')}]` : ''}
// ============================================================

package com.example.limiter.guard;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

public class ${className}Guard {

    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofMillis(500))
            .build();

    private static final String RLAAS_URL = "${hostUrl}/v1/check";
    private static final String API_KEY = System.getenv().getOrDefault("RLAAS_API_KEY", "${apiKey}");

    /**
     * Intercepts request to ${policy.endpoint} and executes dummy business logic only if allowed.
     */
    public void processRequest(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        // 1. Construct dynamic payload matching policy key requirements
        String payload = """
            {
${jsonLines.join('\n')}
            }
            """${formatArgs.length > 0 ? `.formatted(${formatCall})` : ''};

        HttpRequest checkRequest = HttpRequest.newBuilder()
                .uri(URI.create(RLAAS_URL))
                .header("Content-Type", "application/json")
                .header("X-API-Key", API_KEY)
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .timeout(Duration.ofMillis(800))
                .build();

        // 2. Query RLaaS Gateway
        HttpResponse<String> response = HTTP_CLIENT.send(checkRequest, HttpResponse.BodyHandlers.ofString());

        // 3. Handle rate limit exceeded (HTTP 429)
        if (response.statusCode() == 429) {
            String retryAfter = response.headers().firstValue("Retry-After").orElse("1");
            resp.setStatus(429);
            resp.setHeader("Retry-After", retryAfter);
            resp.setContentType("application/json");
            resp.getWriter().write("""
                {
                    "error": "Too Many Requests",
                    "retryAfterSeconds": %s
                }
                """.formatted(retryAfter));
            return;
        }

        // 4. Rate limit verification passed -> Execute dummy protected business method
        executeProtected${className}Service(req, resp);
    }

    /**
     * Protected business logic execution
     */
    private void executeProtected${className}Service(HttpServletRequest req, HttpServletResponse resp) throws Exception {
        resp.setStatus(HttpServletResponse.SC_OK);
        resp.setContentType("application/json");
        resp.getWriter().write("""
            {
                "success": true,
                "message": "Protected logic executed for %s"
            }
            """.formatted("${policy.endpoint}"));
    }

    private String resolveUserId(HttpServletRequest req) {
        Object userAttr = req.getAttribute("userId");
        return userAttr != null ? userAttr.toString() : "usr_anonymous";
    }

    private String resolveClientIp(HttpServletRequest req) {
        String xf = req.getHeader("X-Forwarded-For");
        return (xf != null && !xf.isBlank()) ? xf.split(",")[0].trim() : req.getRemoteAddr();
    }
}
`;
}

export function generatePythonSnippet({ policy, hostUrl, apiKey }: SnippetParams): string {
  const strategy = policy.keyStrategy?.type || 'IP';
  const fields = (policy.keyStrategy?.fields || policy.keyStrategy?.custom || []) as string[];

  const needsUser = strategy === 'USER_ID' || strategy === 'USER' || fields.includes('USER_ID');
  const needsIp = strategy === 'IP' || fields.includes('IP');

  const pyPayloadLines = [
    `        "projectId": "${policy.projectId}",`,
    `        "endpoint": "${policy.endpoint}",`,
  ];

  if (needsUser) {
    pyPayloadLines.push(`        "userId": user_id or "usr_anonymous",`);
  }
  if (needsIp) {
    pyPayloadLines.push(`        "clientIp": client_ip or "127.0.0.1",`);
  }

  const funcName = policy.name.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'rate_limit';

  return `# ============================================================
# RLaaS Integration: ${policy.name}
# Endpoint: ${policy.endpoint}
# Key Strategy: ${strategy}${fields.length > 0 ? ` [${fields.join(' + ')}]` : ''}
# ============================================================

import os
import requests

RLAAS_URL = "${hostUrl}/v1/check"
RLAAS_API_KEY = os.getenv("RLAAS_API_KEY", "${apiKey}")

def handle_${funcName}_request(${needsUser ? 'user_id=None, ' : ''}${needsIp ? 'client_ip=None' : ''}):
    """
    Evaluates rate limit against RLaaS before executing protected business logic.
    """
    payload = {
${pyPayloadLines.join('\n')}
    }

    response = requests.post(
        RLAAS_URL,
        headers={
            "Content-Type": "application/json",
            "X-API-Key": RLAAS_API_KEY,
        },
        json=payload,
        timeout=1.0,
    )

    if response.status_code == 429:
        retry_after = response.headers.get("Retry-After", "1")
        raise Exception(f"Rate limit exceeded. Please retry after {retry_after} seconds.")

    # Quota approved -> Execute protected business logic
    return execute_protected_${funcName}_service()

def execute_protected_${funcName}_service():
    """
    Dummy method execution protected by RLaaS
    """
    return {
        "success": True,
        "message": "Protected logic executed for ${policy.endpoint}",
    }
`;
}

export function generateCurlSnippet({ policy, hostUrl, apiKey }: SnippetParams): string {
  const strategy = policy.keyStrategy?.type || 'IP';
  const fields = (policy.keyStrategy?.fields || policy.keyStrategy?.custom || []) as string[];

  const needsUser = strategy === 'USER_ID' || strategy === 'USER' || fields.includes('USER_ID');
  const needsIp = strategy === 'IP' || fields.includes('IP');

  const curlBody: Record<string, any> = {
    projectId: policy.projectId,
    endpoint: policy.endpoint,
  };

  if (needsUser) {
    curlBody.userId = 'usr_12345';
  }
  if (needsIp) {
    curlBody.clientIp = '192.168.1.100';
  }

  return `curl -X POST "${hostUrl}/v1/check" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -d '${JSON.stringify(curlBody, null, 2)}'
`;
}
