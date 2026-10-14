package com.tradingterminal.backend;

public record NewsItem(String headline, String source, long datetime, String url) {
}