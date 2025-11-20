package com.example.match_me.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.match_me.entity.User;
import com.example.match_me.entity.UsersChat;

@Repository
public interface UsersChatRepository extends JpaRepository<UsersChat, Long> {
    
    // Paginated: Find all messages between two users (by chat ID)
    @Query("SELECT uc FROM UsersChat uc WHERE uc.chat.id = :chatId ORDER BY uc.sentAt DESC")
    Page<UsersChat> findMessagesByChatId(@Param("chatId") Long chatId, Pageable pageable);
    
    // Find all messages where a user is involved
    @Query("SELECT uc FROM UsersChat uc WHERE " +
           "uc.chat.user1.id = :userId OR uc.chat.user2.id = :userId " +
           "ORDER BY uc.sentAt DESC")
    List<UsersChat> findAllChatsForUser(@Param("userId") Long userId);
    
    // Check if there are any messages in a specific chat
    @Query("SELECT COUNT(uc) > 0 FROM UsersChat uc WHERE uc.chat.id = :chatId")
    boolean existsMessagesByChatId(@Param("chatId") Long chatId);
    
    // Get conversation partners for a user (distinct users they've chatted with)
    @Query("SELECT DISTINCT CASE " +
           "WHEN uc.chat.user1.id = :userId THEN uc.chat.user2 " +
           "ELSE uc.chat.user1 " +
           "END FROM UsersChat uc WHERE " +
           "uc.chat.user1.id = :userId OR uc.chat.user2.id = :userId")
    List<User> findConversationPartners(@Param("userId") Long userId);
} 