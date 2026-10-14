package com.tradingterminal.backend;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/news")
@CrossOrigin(origins = "http://localhost:5173")
public class NewsController {

    private final FinnhubService finnhubService;

    public NewsController(FinnhubService finnhubService) {
        this.finnhubService = finnhubService;
    }

    @GetMapping("/{symbol}")
    public List<NewsItem> getNews(@PathVariable String symbol) {
        return finnhubService.getCompanyNews(symbol);
    }
}