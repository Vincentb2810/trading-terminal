package com.tradingterminal.backend;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class FinnhubService {

    private final RestClient restClient;
    private final String apiKey;

    public FinnhubService(@Value("${finnhub.api.key}") String apiKey) {
        this.apiKey = apiKey;
        this.restClient = RestClient.create("https://finnhub.io/api/v1");
    }

    public Quote getQuote(String symbol) {
        return restClient.get()
                .uri("/quote?symbol={symbol}&token={token}", symbol, apiKey)
                .retrieve()
                .body(Quote.class);
    }
}