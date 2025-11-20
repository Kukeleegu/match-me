package com.example.match_me.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.match_me.entity.Chat;

@Repository
public interface ChatRepository extends JpaRepository<Chat, Long> {
    
    // Find a chat between two users (in any order)
    @Query("SELECT c FROM Chat c WHERE " +
           "(c.user1.id = :user1Id AND c.user2.id = :user2Id) OR " +
           "(c.user1.id = :user2Id AND c.user2.id = :user1Id)")
    Optional<Chat> findChatBetweenUsers(@Param("user1Id") Long user1Id, @Param("user2Id") Long user2Id);
    
    // Find all chats where a user is involved
    @Query("SELECT c FROM Chat c WHERE " +
           "c.user1.id = :userId OR c.user2.id = :userId")
    List<Chat> findChatsByUserId(@Param("userId") Long userId);
    
    // Check if a chat exists between two users
    @Query("SELECT COUNT(c) > 0 FROM Chat c WHERE " +
           "(c.user1.id = :user1Id AND c.user2.id = :user2Id) OR " +
           "(c.user1.id = :user2Id AND c.user2.id = :user1Id)")
    boolean existsChatBetweenUsers(@Param("user1Id") Long user1Id, @Param("user2Id") Long user2Id);
} 