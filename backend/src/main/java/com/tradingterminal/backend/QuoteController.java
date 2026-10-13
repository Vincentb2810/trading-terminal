package com.tradingterminal.backend;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/quote")
@CrossOrigin(origins = "http://localhost:5173")
public class QuoteController {

    private final FinnhubService finnhubService;

    public QuoteController(FinnhubService finnhubService) {
        this.finnhubService = finnhubService;
    }

    @GetMapping("/{symbol}")
    public Quote getQuote(@PathVariable String symbol) {
        return finnhubService.getQuote(symbol);
    }
}