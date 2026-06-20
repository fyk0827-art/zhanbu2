package com.lifeblueprint.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.lifeblueprint.config.MetaProperties;
import com.lifeblueprint.config.PaymentProperties;
import com.lifeblueprint.domain.OrderAttribution;
import com.lifeblueprint.domain.OrderRecord;
import com.lifeblueprint.repository.PaymentRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

@Slf4j
@Service
public class FacebookCapiService {

    private static final String GRAPH_VERSION = "v19.0";

    private final MetaProperties metaProps;
    private final PaymentProperties paymentProps;
    private final PaymentRepository repo;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public FacebookCapiService(
            MetaProperties metaProps,
            PaymentProperties paymentProps,
            PaymentRepository repo,
            RestTemplate restTemplate,
            ObjectMapper objectMapper
    ) {
        this.metaProps = metaProps;
        this.paymentProps = paymentProps;
        this.repo = repo;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public void reportPurchase(OrderRecord order) {
        if (order == null || order.id() == null || order.id().isBlank()) {
            return;
        }
        if (!metaProps.isConfigured()) {
            log.warn("Meta CAPI not configured; skip Purchase for order {}", order.id());
            return;
        }
        if (repo.hasSuccessfulFacebookEvent(order.id())) {
            return;
        }

        String eventId = order.id();
        Optional<OrderAttribution> attribution = repo.findOrderAttribution(order.id());
        ObjectNode payload = buildPurchasePayload(order, attribution.orElse(null), eventId);
        String url = "https://graph.facebook.com/" + GRAPH_VERSION + "/"
                + encode(metaProps.getPixelId()) + "/events?access_token=" + encode(metaProps.getCapiAccessToken());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> request = new HttpEntity<>(payload.toString(), headers);

        try {
            ResponseEntity<JsonNode> response = restTemplate.postForEntity(url, request, JsonNode.class);
            String responseText = response.getBody() != null ? response.getBody().toString() : String.valueOf(response.getStatusCode());
            boolean success = response.getStatusCode().is2xxSuccessful();
            repo.recordFacebookEvent(order.id(), eventId, success, responseText);
            if (!success) {
                log.warn("Meta CAPI Purchase failed for order {}: {}", order.id(), response.getStatusCode());
            }
        } catch (Exception e) {
            repo.recordFacebookEvent(order.id(), eventId, false, e.getMessage());
            log.warn("Meta CAPI Purchase error for order {}: {}", order.id(), e.getMessage());
        }
    }

    private ObjectNode buildPurchasePayload(OrderRecord order, OrderAttribution attribution, String eventId) {
        ObjectNode root = objectMapper.createObjectNode();
        ArrayNode data = root.putArray("data");
        ObjectNode event = data.addObject();
        event.put("event_name", "Purchase");
        event.put("event_time", System.currentTimeMillis() / 1000);
        event.put("event_id", eventId);
        event.put("action_source", "website");
        event.put("event_source_url", sourceUrl(attribution));

        ObjectNode userData = event.putObject("user_data");
        if (attribution != null) {
            putIfText(userData, "client_ip_address", attribution.clientIp());
            putIfText(userData, "client_user_agent", attribution.userAgent());
            putIfText(userData, "fbp", attribution.fbp());
            putIfText(userData, "fbc", attribution.fbc());
        }
        if (!userData.has("client_ip_address")) {
            userData.put("client_ip_address", "127.0.0.1");
        }
        if (!userData.has("client_user_agent")) {
            userData.put("client_user_agent", "unknown");
        }

        ObjectNode customData = event.putObject("custom_data");
        customData.put("currency", blankToDefault(metaProps.getCurrency(), "USD"));
        customData.put("value", order.amount() / 100.0);
        customData.put("content_name", blankToDefault(metaProps.getProductName(), "Full Life Blueprint Report"));

        if (metaProps.getTestEventCode() != null && !metaProps.getTestEventCode().isBlank()) {
            root.put("test_event_code", metaProps.getTestEventCode().trim());
        }
        return root;
    }

    private String sourceUrl(OrderAttribution attribution) {
        if (attribution != null && attribution.eventSourceUrl() != null && !attribution.eventSourceUrl().isBlank()) {
            return attribution.eventSourceUrl();
        }
        return paymentProps.getFrontendUrl();
    }

    private static void putIfText(ObjectNode node, String field, String value) {
        if (value != null && !value.isBlank()) {
            node.put(field, value.trim());
        }
    }

    private static String blankToDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private static String encode(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }
}
