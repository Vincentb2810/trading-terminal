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

    public java.util.List<NewsItem> getCompanyNews(String symbol) {
        java.time.LocalDate to = java.time.LocalDate.now();
        java.time.LocalDate from = to.minusDays(7);
        NewsItem[] items = restClient.get()
                .uri("/company-news?symbol={symbol}&from={from}&to={to}&token={token}", symbol, from, to, apiKey)
                .retrieve()
                .body(NewsItem[].class);
        return java.util.Arrays.asList(items);
    }
}