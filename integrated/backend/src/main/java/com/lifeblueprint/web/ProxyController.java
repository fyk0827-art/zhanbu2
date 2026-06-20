package com.lifeblueprint.web;

import com.lifeblueprint.config.ProxyProperties;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;

@RestController
@RequestMapping("/api/proxy")
public class ProxyController {

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

        HttpEntity<String> request = new HttpEntity<>(body, headers);

        ResponseEntity<byte[]> proxyResponse = restTemplate.exchange(
                proxyProps.getBaseUrl() + "/chat/completions",
                HttpMethod.POST,
                request,
                byte[].class
        );

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.setStatus(proxyResponse.getStatusCode().value());
        if (proxyResponse.getBody() != null) {
            response.getOutputStream().write(proxyResponse.getBody());
        }
    }
}
