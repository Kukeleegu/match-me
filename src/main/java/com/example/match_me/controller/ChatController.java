package com.example.match_me.controller;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import com.example.match_me.DTO.ChatMessage;
import com.example.match_me.DTO.UsersChatDTO;
import com.example.match_me.service.ChatService;
import com.example.match_me.service.LikeService;
import com.example.match_me.service.UserService;

@Controller
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private LikeService likeService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private ChatService chatService;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private final Map<String, Long> lastHeartbeats = new HashMap<>();
    private final Map<String, Boolean> userStatuses = new HashMap<>();

    // Private chat endpoint for matched users
    @MessageMapping("/chat.private/{recipientId}")
    public void sendPrivateMessage(
        @Payload ChatMessage message,
        @DestinationVariable Long recipientId,
        Principal sender
    ) {
        String senderEmail = sender.getName();
        
        // Get sender's user ID from email
        Long senderId;
        try {
            senderId = userService.getUserByEmail(senderEmail).getId();
        } catch (Exception e) {
            System.err.println("ERROR: Could not find user with email: " + senderEmail);
            throw new IllegalArgumentException("User not found");
        }
        
        // Verify users are matched before allowing private chat
        if (!likeService.areUsersMatched(senderId, recipientId)) {
            System.err.println("UNAUTHORIZED: User '" + senderEmail + "' tried to message non-matched user " + recipientId);
            throw new IllegalArgumentException("Users are not matched - private chat not allowed");
        }
        
        try {
            // Save message to database
            UsersChatDTO savedMessage = chatService.saveMessage(senderId, recipientId, message.getContent());
            
            // Use the chat ID for the WebSocket topic
            String topicName = "/topic/chat/" + savedMessage.getChatId();
            
            // Send message to the specific private chat topic with proper timestamp
            message.setSentAt(savedMessage.getSentAt());
            messagingTemplate.convertAndSend(topicName, message);
            
        } catch (Exception e) {
            System.err.println("ERROR saving message to database: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to save message", e);
        }
    }
    
    // Add typing status endpoint
    @MessageMapping("/chat/{chatId}/typing")
    public void handleTypingStatus(@DestinationVariable Long chatId, @Payload Map<String, Object> payload) {
        try {
            // Safely get values with null checks
            boolean isTyping = payload.containsKey("isTyping") ? (boolean) payload.get("isTyping") : false;
            Long userId = null;
            
            // Safely parse userId if it exists
            if (payload.containsKey("userId") && payload.get("userId") != null) {
                try {
                    Object userIdObj = payload.get("userId");
                    if (userIdObj instanceof Integer) {
                        userId = ((Integer) userIdObj).longValue();
                    } else if (userIdObj instanceof Long) {
                        userId = (Long) userIdObj;
                    } else if (userIdObj instanceof String) {
                        userId = Long.parseLong((String) userIdObj);
                    } else {
                        userId = Long.parseLong(userIdObj.toString());
                    }
                } catch (NumberFormatException e) {
                    System.err.println("Error parsing userId: " + e.getMessage());
                }
            }
            
            // Create response payload
            Map<String, Object> response = new HashMap<>();
            response.put("chatId", chatId);
            response.put("isTyping", isTyping);
            if (userId != null) {
                response.put("userId", userId);
            }

            String destination = "/topic/chat/" + chatId + "/typing";
            
            // Broadcast typing status to all users in the chat
            messagingTemplate.convertAndSend(destination, response);
            
        } catch (Exception e) {
            System.err.println("Error handling typing status: " + e.getMessage());
            e.printStackTrace();
            
            // Send a safe fallback response
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("chatId", chatId);
            errorResponse.put("isTyping", false);
            messagingTemplate.convertAndSend("/topic/chat/" + chatId + "/typing", errorResponse);
        }
    }

    @MessageMapping("/presence")
    @SendTo("/topic/presence")
    public Map<String, Object> handlePresenceChange(Principal principal) {
        String email = principal.getName();
        long currentTime = System.currentTimeMillis();
        
        // Get user ID from email
        Long userId = userService.getUserByEmail(email).getId();
        
        // Update heartbeat and status using user ID
        lastHeartbeats.put(userId.toString(), currentTime);
        userStatuses.put(userId.toString(), true);
        
        Map<String, Object> status = new HashMap<>();
        status.put("user", userId.toString());
        status.put("online", true);
        status.put("timestamp", currentTime);
        
        return status;
    }

    @MessageMapping("/presence/request")
    public void handlePresenceRequest(Principal principal) {
        long currentTime = System.currentTimeMillis();
        long staleThreshold = 45000; // 45 seconds
        
        // Get current user's matches
        Long currentUserId = userService.getUserByEmail(principal.getName()).getId();
        List<Long> matchedUserIds = likeService.getConnectionIds(currentUserId);
        
        // Only broadcast status for matched users
        matchedUserIds.forEach(userId -> {
            String userIdStr = userId.toString();
            if (lastHeartbeats.containsKey(userIdStr)) {
                long lastHeartbeat = lastHeartbeats.get(userIdStr);
                boolean isOnline = userStatuses.getOrDefault(userIdStr, false) && 
                                 (currentTime - lastHeartbeat <= staleThreshold);
                
                Map<String, Object> status = new HashMap<>();
                status.put("user", userIdStr);
                status.put("online", isOnline);
                status.put("timestamp", isOnline ? lastHeartbeat : currentTime);
                
                messagingTemplate.convertAndSend("/topic/presence", status);
            }
        });
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String email = headerAccessor.getUser().getName();
        long currentTime = System.currentTimeMillis();
        
        // Get user ID from email
        Long userId = userService.getUserByEmail(email).getId();
        
        // Update status maps using user ID
        lastHeartbeats.remove(userId.toString());
        userStatuses.remove(userId.toString());
        
        Map<String, Object> status = new HashMap<>();
        status.put("user", userId.toString());
        status.put("online", false);
        status.put("timestamp", currentTime);
        
        messagingTemplate.convertAndSend("/topic/presence", status);
    }

    // Scheduled task to check for stale connections
    @org.springframework.scheduling.annotation.Scheduled(fixedRate = 30000) // Run every 30 seconds
    public void checkStaleConnections() {
        long currentTime = System.currentTimeMillis();
        long staleThreshold = 45000; // 45 seconds
        
        lastHeartbeats.entrySet().removeIf(entry -> {
            String email = entry.getKey();
            long lastHeartbeat = entry.getValue();
            
            if (currentTime - lastHeartbeat > staleThreshold && userStatuses.getOrDefault(email, false)) {
                // Mark user as offline
                userStatuses.put(email, false);
                
                // Send offline status
                Map<String, Object> status = new HashMap<>();
                status.put("user", email);
                status.put("online", false);
                status.put("timestamp", currentTime);
                messagingTemplate.convertAndSend("/topic/presence", status);
                
                return true; // Remove from heartbeats map
            }
            return false;
        });
    }

    // REST endpoints for chat management
    
    @GetMapping("/history/{otherUserId}")
    public ResponseEntity<?> getChatHistory(
        @PathVariable Long otherUserId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size) {
        try {
            Long currentUserId = userService.getCurrentUser().getId();
            Page<UsersChatDTO> chatHistory = chatService.getChatHistory(currentUserId, otherUserId, page, size);

            // Return both content and pagination info
            Map<String, Object> response = new HashMap<>();
            response.put("content", chatHistory.getContent());
            response.put("currentPage", chatHistory.getNumber());
            response.put("totalItems", chatHistory.getTotalElements());
            response.put("totalPages", chatHistory.getTotalPages());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/history/{otherUserId}/recent")
    public ResponseEntity<?> getRecentChatHistory(
        @PathVariable Long otherUserId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size) {
        try {
            Long currentUserId = userService.getCurrentUser().getId();
            Page<UsersChatDTO> chatHistory = chatService.getRecentChatHistory(currentUserId, otherUserId, page, size);

            Map<String, Object> response = new HashMap<>();
            response.put("content", chatHistory.getContent());
            response.put("currentPage", chatHistory.getNumber());
            response.put("totalItems", chatHistory.getTotalElements());
            response.put("totalPages", chatHistory.getTotalPages());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    

    
    @GetMapping("/conversations")
    public ResponseEntity<Map<String, Object>> getConversationPartners() {
        try {
            Long currentUserId = userService.getCurrentUser().getId();
            List<com.example.match_me.entity.User> partners = chatService.getConversationPartners(currentUserId);
            
            // Convert to a simple format for the frontend
            List<Map<String, Object>> partnerList = partners.stream()
                    .map(user -> {
                        Map<String, Object> partnerInfo = new HashMap<>();
                        partnerInfo.put("id", user.getId());
                        partnerInfo.put("email", user.getEmail());
                        partnerInfo.put("displayName", user.getProfile() != null ? 
                                user.getProfile().getDisplayName() : "Unknown");
                        return partnerInfo;
                    })
                    .collect(java.util.stream.Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("conversationPartners", partnerList);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/exists/{otherUserId}")
    public ResponseEntity<Map<String, Object>> checkChatExists(@PathVariable Long otherUserId) {
        try {
            Long currentUserId = userService.getCurrentUser().getId();
            boolean exists = chatService.hasChatHistory(currentUserId, otherUserId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("chatExists", exists);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/chat-id/{otherUserId}")
    public ResponseEntity<Map<String, Object>> getChatId(@PathVariable Long otherUserId) {
        try {
            Long currentUserId = userService.getCurrentUser().getId();
            
            // Verify users are matched
            if (!likeService.areUsersMatched(currentUserId, otherUserId)) {
                return ResponseEntity.badRequest().build();
            }
            
            Long chatId = chatService.findOrCreateChatId(currentUserId, otherUserId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("chatId", chatId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
