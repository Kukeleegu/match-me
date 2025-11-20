package com.example.match_me.DTO;

import java.time.LocalDateTime;

public class UsersChatDTO {
    
    private Long id;
    private Long chatId;
    private Long senderId;
    private String senderDisplayName;
    private String messageContent;
    private LocalDateTime sentAt;
    
    // Constructors
    public UsersChatDTO() {}
    
    public UsersChatDTO(Long id, Long chatId, Long senderId, 
                       String senderDisplayName, String messageContent, LocalDateTime sentAt) {
        this.id = id;
        this.chatId = chatId;
        this.senderId = senderId;
        this.senderDisplayName = senderDisplayName;
        this.messageContent = messageContent;
        this.sentAt = sentAt;
    }
    
    // Getters and setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getChatId() {
        return chatId;
    }
    
    public void setChatId(Long chatId) {
        this.chatId = chatId;
    }
    
    public Long getSenderId() {
        return senderId;
    }
    
    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }
    
    public String getSenderDisplayName() {
        return senderDisplayName;
    }
    
    public void setSenderDisplayName(String senderDisplayName) {
        this.senderDisplayName = senderDisplayName;
    }
    
    public String getMessageContent() {
        return messageContent;
    }
    
    public void setMessageContent(String messageContent) {
        this.messageContent = messageContent;
    }
    
    public LocalDateTime getSentAt() {
        return sentAt;
    }
    
    public void setSentAt(LocalDateTime sentAt) {
        this.sentAt = sentAt;
    }
} 