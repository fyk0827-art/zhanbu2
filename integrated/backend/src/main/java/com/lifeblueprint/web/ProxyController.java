package com.lifeblueprint.web;

import com.lifeblueprint.config.ProxyProperties;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

@RestController
@RequestMapping("/api/proxy")
public class ProxyController {

    private static final int BUFFER_SIZE = 8192;

    private final ProxyProperties proxyProps;
    private final RestTemplate restTemplate;

    public ProxyController(ProxyProperties proxyProps, RestTemplate restTemplate) {
        this.proxyProps = proxyProps;
        this.restTemplate = restTemplate;
    }

    @PostMapping("/chat")
    public void chat(@RequestBody String body, HttpServletResponse response) throws IOException {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(proxyProps.getApiKey());
        byte[] bodyBytes = body.getBytes(java.nio.charset.StandardCharsets.UTF_8);

        restTemplate.execute(
                proxyProps.getBaseUrl() + "/chat/completions",
                HttpMethod.POST,
                clientHttpRequest -> {
                    clientHttpRequest.getHeaders().addAll(headers);
                    clientHttpRequest.getBody().write(bodyBytes);
                },
                clientHttpResponse -> {
                    response.setStatus(clientHttpResponse.getStatusCode().value());
                    response.setContentType("text/event-stream");
                    response.setCharacterEncoding("UTF-8");
                    response.setHeader("Cache-Control", "no-cache");
                    response.setHeader("X-Accel-Buffering", "no");

                    try (InputStream is = clientHttpResponse.getBody();
                         OutputStream os = response.getOutputStream()) {
                        byte[] buffer = new byte[BUFFER_SIZE];
                        int len;
                        while ((len = is.read(buffer)) != -1) {
                            os.write(buffer, 0, len);
                            os.flush();
                        }
                    }
                    return null;
                }
        );
    }
}
