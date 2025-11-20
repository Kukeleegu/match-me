package com.example.match_me.controller;

import com.example.match_me.DTO.LikeRequest;
import com.example.match_me.DTO.LikeResponse;
import com.example.match_me.DTO.UserLikeDTO;
import com.example.match_me.DTO.EnrichedMatchDTO;
import com.example.match_me.service.LikeService;
import com.example.match_me.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/likes")
public class LikeController {

    @Autowired
    private LikeService likeService;

    @Autowired
    private UserService userService;

    @PostMapping("/interact")
    public ResponseEntity<LikeResponse> interactWithUser(@RequestBody LikeRequest likeRequest) {
        Long currentUserId = userService.getCurrentUser().getId();
        LikeResponse response = likeService.likeUser(currentUserId, likeRequest);
        
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/remove")
    public ResponseEntity<Map<String, Object>> removeInteraction(@RequestBody LikeRequest likeRequest) {
        Long currentUserId = userService.getCurrentUser().getId();
        boolean success = likeService.removeInteraction(currentUserId, likeRequest.getLikedUserId());
        
        Map<String, Object> response = new HashMap<>();
        if (success) {
            response.put("success", true);
            response.put("message", "Interaction removed successfully");
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "Failed to remove interaction");
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/given")
    public ResponseEntity<List<UserLikeDTO>> getLikesGiven() {
        Long currentUserId = userService.getCurrentUser().getId();
        List<UserLikeDTO> likes = likeService.getLikesGivenByUser(currentUserId);
        return ResponseEntity.ok(likes);
    }

    @GetMapping("/dislikes/given")
    public ResponseEntity<List<UserLikeDTO>> getDislikesGiven() {
        Long currentUserId = userService.getCurrentUser().getId();
        List<UserLikeDTO> dislikes = likeService.getDislikesGivenByUser(currentUserId);
        return ResponseEntity.ok(dislikes);
    }

    @GetMapping("/all-interactions")
    public ResponseEntity<List<UserLikeDTO>> getAllInteractions() {
        Long currentUserId = userService.getCurrentUser().getId();
        List<UserLikeDTO> interactions = likeService.getAllInteractionsByUser(currentUserId);
        return ResponseEntity.ok(interactions);
    }

    @GetMapping("/received")
    public ResponseEntity<List<UserLikeDTO>> getLikesReceived() {
        Long currentUserId = userService.getCurrentUser().getId();
        List<UserLikeDTO> likes = likeService.getLikesReceivedByUser(currentUserId);
        return ResponseEntity.ok(likes);
    }

    @GetMapping("/matches")
    public ResponseEntity<List<UserLikeDTO>> getMatches() {
        Long currentUserId = userService.getCurrentUser().getId();
        List<UserLikeDTO> matches = likeService.getMatchesForUser(currentUserId);
        return ResponseEntity.ok(matches);
    }

    @GetMapping("/check/{likedUserId}")
    public ResponseEntity<Map<String, Object>> checkIfInteracted(@PathVariable Long likedUserId) {
        Long currentUserId = userService.getCurrentUser().getId();
        boolean hasInteracted = likeService.hasUserInteracted(currentUserId, likedUserId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("hasInteracted", hasInteracted);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getLikeStats() {
        Long currentUserId = userService.getCurrentUser().getId();
        
        long likesGiven = likeService.getLikeCountGiven(currentUserId);
        long dislikesGiven = likeService.getDislikeCountGiven(currentUserId);
        long likesReceived = likeService.getLikeCountReceived(currentUserId);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("likesGiven", likesGiven);
        stats.put("dislikesGiven", dislikesGiven);
        stats.put("likesReceived", likesReceived);
        
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/enriched-matches")
    public ResponseEntity<List<EnrichedMatchDTO>> getEnrichedMatches() {
        Long currentUserId = userService.getCurrentUser().getId();
        List<EnrichedMatchDTO> matches = likeService.getEnrichedMatchesForUser(currentUserId);
        return ResponseEntity.ok(matches);
    }

    @GetMapping("/connections")
    public ResponseEntity<List<Long>> getConnections() {
        try {
            Long currentUserId = userService.getCurrentUser().getId();
            List<Long> connectionIds = likeService.getConnectionIds(currentUserId);
            return ResponseEntity.ok(connectionIds);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
} 
