package com.tradingterminal.backend;

public record DisasterEvent(
        String id,
        String type,
        String alertLevel,
        String title,
        String country,
        double lat,
        double lon,
        String pubDate) {
}