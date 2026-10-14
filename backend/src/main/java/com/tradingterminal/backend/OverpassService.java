package com.tradingterminal.backend;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class OverpassService {

    private static final String OVERPASS_URL = "https://overpass-api.de/api/interpreter";
    private static final String QUERY = """
            [out:json][timeout:180];
            (
              nwr["power"="plant"]["plant:source"="nuclear"];
              nwr["power"="plant"]["plant:source"="wind"];
              node["man_made"="offshore_platform"];
            );
            out center tags;
            """;

    private final RestClient restClient = RestClient.create();
    private final ObjectMapper mapper = new ObjectMapper();
    private volatile List<InfrastructureSite> cache = Collections.emptyList();

    @Scheduled(fixedRate = 24L * 60 * 60 * 1000, initialDelay = 0)
    public void refresh() {
        try {
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("data", QUERY);

            String json = restClient.post()
                    .uri(OVERPASS_URL)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(String.class);

            cache = parse(json);
        } catch (Exception e) {
            System.err.println("Overpass-Abfrage fehlgeschlagen, alte Daten bleiben aktiv: " + e.getMessage());
        }
    }

    public List<InfrastructureSite> getSites() {
        return cache;
    }

    private List<InfrastructureSite> parse(String json) throws Exception {
        JsonNode root = mapper.readTree(json);
        List<InfrastructureSite> sites = new ArrayList<>();

        for (JsonNode el : root.path("elements")) {
            JsonNode tags = el.path("tags");
            double lat, lon;
            if (el.has("lat") && el.has("lon")) {
                lat = el.get("lat").asDouble();
                lon = el.get("lon").asDouble();
            } else if (el.has("center")) {
                lat = el.path("center").path("lat").asDouble();
                lon = el.path("center").path("lon").asDouble();
            } else {
                continue;
            }

            String category;
            String source = tags.path("plant:source").asText("");
            if ("nuclear".equals(source)) {
                category = "nuclear";
            } else if ("wind".equals(source)) {
                category = "wind";
            } else if ("offshore_platform".equals(tags.path("man_made").asText(""))) {
                category = "oil";
            } else {
                continue;
            }

            String name = tags.path("name").asText(null);
            if (name == null || name.isBlank()) {
                name = switch (category) {
                    case "nuclear" -> "Kernkraftwerk (unbenannt)";
                    case "wind" -> "Windpark (unbenannt)";
                    default -> "Offshore-Plattform (unbenannt)";
                };
            }

            sites.add(new InfrastructureSite(
                    el.path("type").asText() + "/" + el.path("id").asLong(),
                    category,
                    name,
                    lat,
                    lon));
        }
        return sites;
    }
}