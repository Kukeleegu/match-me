package com.example.match_me.controller;

import com.example.match_me.service.DataInitializationService;
import com.example.match_me.service.UserService;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dev")
@Profile({"dev", "development", "local"}) // Only available in development profiles
public class DevController {

    private final DataInitializationService dataInitializationService;
    private final UserService userService;

    public DevController(DataInitializationService dataInitializationService, UserService userService) {
        this.dataInitializationService = dataInitializationService;
        this.userService = userService;
    }

    @PostMapping("/create-sample-users")
    public ResponseEntity<Map<String, String>> createSampleUsers() {
        try {
            dataInitializationService.createSampleUsers();
            Map<String, String> response = new HashMap<>();
            response.put("message", "Sample users created successfully");
            response.put("note", "This endpoint is only available in development mode");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to create sample users: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/users/count")
    public ResponseEntity<Map<String, Object>> getUserCount() {
        Map<String, Object> response = new HashMap<>();
        response.put("totalUsers", userService.getAllUsers().size());
        response.put("note", "This endpoint is only available in development mode");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getDevInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("message", "Development endpoints active");
        info.put("availableEndpoints", new String[]{
            "POST /api/dev/create-sample-users - Create sample users for testing",
            "GET /api/dev/users/count - Get total user count",
            "GET /api/dev/info - This info endpoint"
        });
        info.put("sampleCredentials", Map.of(
            "emailPattern", "{firstname}{number}@example.com",
            "password", "password123",
            "examples", new String[]{"alex1@example.com", "emma2@example.com", "liam3@example.com"}
        ));
        return ResponseEntity.ok(info);
    }
} 