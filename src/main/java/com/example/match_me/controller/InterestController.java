package com.example.match_me.controller;

import com.example.match_me.entity.Interest;
import com.example.match_me.DTO.InterestDTO;
import com.example.match_me.service.InterestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/interests")
public class InterestController {

    @Autowired
    private InterestService interestService;

    @GetMapping
    public ResponseEntity<List<InterestDTO>> getAllInterests() {
        try {
            List<InterestDTO> interests = interestService.getAllInterests();
            return ResponseEntity.ok(interests);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<InterestDTO>> getInterestsByType(@PathVariable Interest.InterestType type) {
        try {
            List<InterestDTO> interests = interestService.getInterestsByType(type);
            return ResponseEntity.ok(interests);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<InterestDTO>> getInterestsByCategory(@PathVariable String category) {
        try {
            List<InterestDTO> interests = interestService.getInterestsByCategory(category);
            return ResponseEntity.ok(interests);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<InterestDTO>> searchInterests(@RequestParam String query) {
        try {
            List<InterestDTO> interests = interestService.searchInterestsByName(query);
            return ResponseEntity.ok(interests);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createInterest(@RequestBody InterestDTO interestDTO) {
        try {
            InterestDTO createdInterest = interestService.createInterest(interestDTO);
            return ResponseEntity.ok(createdInterest);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateInterest(@PathVariable Long id, @RequestBody InterestDTO interestDTO) {
        try {
            InterestDTO updatedInterest = interestService.updateInterest(id, interestDTO);
            return ResponseEntity.ok(updatedInterest);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteInterest(@PathVariable Long id) {
        try {
            interestService.deleteInterest(id);
            return ResponseEntity.ok("Interest deleted successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
} 