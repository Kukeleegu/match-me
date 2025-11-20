package com.example.match_me.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.match_me.DTO.UsersChatDTO;
import com.example.match_me.entity.Chat;
import com.example.match_me.entity.User;
import com.example.match_me.entity.UsersChat;
import com.example.match_me.repository.ChatRepository;
import com.example.match_me.repository.UserRepository;
import com.example.match_me.repository.UsersChatRepository;

@Service
public class ChatService {
    
    @Autowired
    private UsersChatRepository usersChatRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ChatRepository chatRepository;
    
    @Autowired
    private LikeService likeService;
    
    @Transactional
    public UsersChatDTO saveMessage(Long senderId, Long recipientId, String messageContent) {
        try {
            // Verify users are matched before allowing message saving
            if (!likeService.areUsersMatched(senderId, recipientId)) {
                System.err.println("ERROR: Users are not matched - cannot save message");
                throw new IllegalArgumentException("Users are not matched - chat not allowed");
            }
            
            // Get the users
            Optional<User> senderOpt = userRepository.findById(senderId);
            Optional<User> recipientOpt = userRepository.findById(recipientId);
            
            if (senderOpt.isEmpty() || recipientOpt.isEmpty()) {
                System.err.println("ERROR: User(s) not found");
                throw new IllegalArgumentException("User not found");
            }
            
            User sender = senderOpt.get();
            User recipient = recipientOpt.get();
            
            // Find or create chat between users
            Chat chat = chatRepository.findChatBetweenUsers(senderId, recipientId)
                    .orElseGet(() -> {
                        Chat newChat = new Chat(sender, recipient);
                        return chatRepository.save(newChat);
                    });
            
            UsersChat chatMessage = new UsersChat(chat, sender, messageContent);
            UsersChat savedMessage = usersChatRepository.save(chatMessage);
            
            return convertToDTO(savedMessage);
            
        } catch (Exception e) {
            System.err.println("ERROR in ChatService.saveMessage(): " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    public Page<UsersChatDTO> getChatHistory(Long user1Id, Long user2Id, int page, int size) {
        try {
            // Verify users are matched
            if (!likeService.areUsersMatched(user1Id, user2Id)) {
                System.err.println("ERROR: Users are not matched - cannot retrieve chat history");
                throw new IllegalArgumentException("Users are not matched - chat not allowed");
            }
            
            // Find the chat between users
            Optional<Chat> chatOpt = chatRepository.findChatBetweenUsers(user1Id, user2Id);
            if (chatOpt.isEmpty()) {
                return Page.empty(); // Return empty page if no chat exists
            }
            
            Pageable pageable = PageRequest.of(page, size, Sort.by("sentAt").ascending());
            Page<UsersChat> messagesPage = usersChatRepository.findMessagesByChatId(chatOpt.get().getId(), pageable);
            
            return messagesPage.map(this::convertToDTO);
                    
        } catch (Exception e) {
            System.err.println("ERROR in ChatService.getChatHistory(): " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    public Page<UsersChatDTO> getRecentChatHistory(Long user1Id, Long user2Id, int page, int size) {
        try {
            // Verify users are matched
            if (!likeService.areUsersMatched(user1Id, user2Id)) {
                System.err.println("ERROR: Users are not matched - cannot retrieve chat history");
                throw new IllegalArgumentException("Users are not matched - chat not allowed");
            }
            
            // Find the chat between users
            Optional<Chat> chatOpt = chatRepository.findChatBetweenUsers(user1Id, user2Id);
            if (chatOpt.isEmpty()) {
                return Page.empty(); // Return empty page if no chat exists
            }
            Pageable pageable = PageRequest.of(page, size, Sort.by("sentAt").descending());
            Page<UsersChat> messagesPage = usersChatRepository.findMessagesByChatId(chatOpt.get().getId(), pageable);
            
            // Limit the results from the end (most recent) and reverse to get chronological order
            // The original code had a skip(Math.max(0, messages.getSize() - limit)) and then reverse.
            // This logic is now handled by the Pageable.of(page, size, Sort.by("sentAt").descending())
            // and the mapping will return the correct order.
            
            return messagesPage.map(this::convertToDTO);
                    
        } catch (Exception e) {
            System.err.println("ERROR in ChatService.getRecentChatHistory(): " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    

    
    public List<User> getConversationPartners(Long userId) {
        return usersChatRepository.findConversationPartners(userId);
    }
    
    public Long findOrCreateChatId(Long user1Id, Long user2Id) {
        // Verify users are matched
        if (!likeService.areUsersMatched(user1Id, user2Id)) {
            throw new IllegalArgumentException("Users are not matched - chat not allowed");
        }
        
        // Find or create chat between users
        Optional<Chat> chatOpt = chatRepository.findChatBetweenUsers(user1Id, user2Id);
        if (chatOpt.isPresent()) {
            return chatOpt.get().getId();
        }
        
        // Create new chat if it doesn't exist
        Optional<User> user1Opt = userRepository.findById(user1Id);
        Optional<User> user2Opt = userRepository.findById(user2Id);
        
        if (user1Opt.isEmpty() || user2Opt.isEmpty()) {
            throw new IllegalArgumentException("User not found");
        }
        
        Chat newChat = new Chat(user1Opt.get(), user2Opt.get());
        Chat savedChat = chatRepository.save(newChat);
        return savedChat.getId();
    }
    
    public boolean hasChatHistory(Long user1Id, Long user2Id) {
        Optional<Chat> chatOpt = chatRepository.findChatBetweenUsers(user1Id, user2Id);
        if (chatOpt.isEmpty()) {
            return false;
        }
        return usersChatRepository.existsMessagesByChatId(chatOpt.get().getId());
    }

    public Chat getChatById(Long chatId) {
        return chatRepository.findById(chatId)
            .orElseThrow(() -> new IllegalArgumentException("Chat not found with ID: " + chatId));
    }
    
    private UsersChatDTO convertToDTO(UsersChat usersChat) {
        User sender = usersChat.getSender();
        String senderDisplayName = sender.getProfile() != null ? 
                sender.getProfile().getDisplayName() : "Unknown";
        
        UsersChatDTO dto = new UsersChatDTO();
        dto.setId(usersChat.getId());
        dto.setChatId(usersChat.getChat().getId());
        dto.setSenderId(sender.getId());
        dto.setSenderDisplayName(senderDisplayName);
        dto.setMessageContent(usersChat.getMessageContent());
        dto.setSentAt(usersChat.getSentAt());
        
        return dto;
    }
} 