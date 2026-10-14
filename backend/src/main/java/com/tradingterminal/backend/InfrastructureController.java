package com.tradingterminal.backend;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/infrastructure")
@CrossOrigin(origins = "http://localhost:5173")
public class InfrastructureController {

    private final OverpassService overpassService;

    public InfrastructureController(OverpassService overpassService) {
        this.overpassService = overpassService;
    }

    @GetMapping
    public List<InfrastructureSite> getInfrastructure() {
        return overpassService.getSites();
    }
}