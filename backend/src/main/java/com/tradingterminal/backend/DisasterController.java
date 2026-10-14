package com.tradingterminal.backend;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/disasters")
@CrossOrigin(origins = "http://localhost:5173")
public class DisasterController {

    private final GdacsService gdacsService;

    public DisasterController(GdacsService gdacsService) {
        this.gdacsService = gdacsService;
    }

    @GetMapping
    public List<DisasterEvent> getDisasters() {
        return gdacsService.getEvents();
    }
}