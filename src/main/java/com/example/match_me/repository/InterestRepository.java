package com.example.match_me.repository;

import com.example.match_me.entity.Interest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;

@Repository
public interface InterestRepository extends JpaRepository<Interest, Long> {
    
    List<Interest> findByNameContainingIgnoreCase(String name);
    
    List<Interest> findByType(Interest.InterestType type);
    
    List<Interest> findByCategory(String category);
    
    List<Interest> findBySocialType(Interest.SocialType socialType);
    
    List<Interest> findByPhysical(Boolean physical);
    
    List<Interest> findByMood(Interest.MoodType mood);
    
    Set<Interest> findByIdIn(Set<Long> ids);
} 