package com.example.match_me.service;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.match_me.DTO.EnrichedMatchDTO;
import com.example.match_me.DTO.InterestDTO;
import com.example.match_me.DTO.LikeRequest;
import com.example.match_me.DTO.LikeResponse;
import com.example.match_me.DTO.UserBioDTO;
import com.example.match_me.DTO.UserLikeDTO;
import com.example.match_me.DTO.UserProfileDTO;
import com.example.match_me.entity.User;
import com.example.match_me.entity.UserBio;
import com.example.match_me.entity.UserLike;
import com.example.match_me.entity.UserProfile;
import com.example.match_me.repository.UserLikeRepository;
import com.example.match_me.repository.UserRepository;

@Service
public class LikeService {

    @Autowired
    private UserLikeRepository userLikeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Transactional
    public LikeResponse likeUser(Long likerId, LikeRequest likeRequest) {
        try {
            // Get the users
            Optional<User> likerOpt = userRepository.findById(likerId);
            Optional<User> likedOpt = userRepository.findById(likeRequest.getLikedUserId());

            if (likerOpt.isEmpty() || likedOpt.isEmpty()) {
                return new LikeResponse(false, "User not found");
            }

            User liker = likerOpt.get();
            User liked = likedOpt.get();

            // Check if user is trying to interact with themselves
            if (likerId.equals(likeRequest.getLikedUserId())) {
                return new LikeResponse(false, "Cannot interact with yourself");
            }

            // Check if interaction already exists
            Optional<UserLike> existingInteraction = userLikeRepository.findByLikerAndLiked(liker, liked);
            if (existingInteraction.isPresent()) {
                UserLike interaction = existingInteraction.get();
                interaction.setLike(likeRequest.isLike());
                userLikeRepository.save(interaction);
            } else {
                UserLike userLike = new UserLike(liker, liked, likeRequest.isLike());
                userLikeRepository.save(userLike);
            }

            // Check if this creates a match (only if it's a like)
            boolean isMatch = false;
            if (likeRequest.isLike()) {
                Optional<UserLike> reverseInteraction = userLikeRepository.findByLikerAndLiked(liked, liker);
                if (reverseInteraction.isPresent()) {
                    isMatch = reverseInteraction.get().isLike();
                    
                    // If it's a match, send WebSocket notifications to both users
                    if (isMatch) {
                        // Get display names for both users
                        String likerDisplayName = liker.getProfile() != null ? liker.getProfile().getDisplayName() : "User " + liker.getId();
                        String likedDisplayName = liked.getProfile() != null ? liked.getProfile().getDisplayName() : "User " + liked.getId();
                        
                        // Send notification to liker
                        messagingTemplate.convertAndSend(
                            "/topic/matches/" + liker.getId(),
                            new MatchNotification(likerDisplayName, liked.getId())
                        );
                        
                        // Send notification to liked user
                        messagingTemplate.convertAndSend(
                            "/topic/matches/" + liked.getId(),
                            new MatchNotification(likedDisplayName, liker.getId())
                        );
                    }
                }
            }

            String message = isMatch ? "It's a match!" : 
                           (likeRequest.isLike() ? "Like sent successfully" : "Dislike recorded");

            return new LikeResponse(true, message, isMatch, likeRequest.getLikedUserId());

        } catch (Exception e) {
            System.err.println("ERROR in LikeService.likeUser(): " + e.getMessage());
            e.printStackTrace();
            return new LikeResponse(false, "Error processing interaction: " + e.getMessage());
        }
    }

    @Transactional
    public boolean removeInteraction(Long likerId, Long likedUserId) {
        try {
            Optional<User> likerOpt = userRepository.findById(likerId);
            Optional<User> likedOpt = userRepository.findById(likedUserId);

            if (likerOpt.isEmpty() || likedOpt.isEmpty()) {
                return false;
            }

            Optional<UserLike> existingInteraction = userLikeRepository.findByLikerAndLiked(likerOpt.get(), likedOpt.get());
            
            if (existingInteraction.isPresent()) {
                userLikeRepository.delete(existingInteraction.get());
                return true;
            }

            return false;
        } catch (Exception e) {
            System.err.println("ERROR in LikeService.removeInteraction(): " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    public List<UserLikeDTO> getLikesGivenByUser(Long userId) {
        List<UserLike> likes = userLikeRepository.findByLikerIdAndLikeEquals(userId, true);
        return likes.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<UserLikeDTO> getDislikesGivenByUser(Long userId) {
        List<UserLike> dislikes = userLikeRepository.findByLikerIdAndLikeEquals(userId, false);
        return dislikes.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<UserLikeDTO> getAllInteractionsByUser(Long userId) {
        List<UserLike> interactions = userLikeRepository.findByLikerId(userId);
        return interactions.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<UserLikeDTO> getLikesReceivedByUser(Long userId) {
        List<UserLike> likes = userLikeRepository.findByLikedIdAndLikeEquals(userId, true);
        return likes.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<UserLikeDTO> getMatchesForUser(Long userId) {
        List<UserLike> matches = userLikeRepository.findMutualLikesByUserId(userId);
        return matches.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<Long> getConnectionIds(Long userId) {
        List<UserLike> matches = userLikeRepository.findMutualLikesByUserId(userId);
        return matches.stream()
            .map(userLike -> userLike.getLiked().getId())
            .collect(Collectors.toList());
    }

    public boolean hasUserInteracted(Long likerId, Long likedUserId) {
        return userLikeRepository.existsByLikerIdAndLikedId(likerId, likedUserId);
    }

    public long getLikeCountGiven(Long userId) {
        return userLikeRepository.countByLikerIdAndLikeEquals(userId, true);
    }

    public long getDislikeCountGiven(Long userId) {
        return userLikeRepository.countByLikerIdAndLikeEquals(userId, false);
    }

    public long getLikeCountReceived(Long userId) {
        return userLikeRepository.countByLikedIdAndLikeEquals(userId, true);
    }

    public List<EnrichedMatchDTO> getEnrichedMatchesForUser(Long userId) {
        List<UserLikeDTO> matches = getMatchesForUser(userId);
        
        return matches.stream()
            .map(match -> {
                EnrichedMatchDTO enriched = new EnrichedMatchDTO(match);
                
                try {
                    // Get user entity first to avoid multiple repository calls
                    Optional<User> userOpt = userRepository.findById(match.getLikedId());
                    if (userOpt.isPresent()) {
                        User user = userOpt.get();
                        
                        // Convert profile directly from entity
                        UserProfile profile = user.getProfile();
                        if (profile != null) {
                            UserProfileDTO profileDTO = new UserProfileDTO();
                            profileDTO.setId(profile.getId());
                            profileDTO.setDisplayName(profile.getDisplayName());
                            profileDTO.setAboutMe(profile.getAboutMe());
                            profileDTO.setCounty(profile.getCounty());
                            profileDTO.setLastSeen(profile.getLastSeen());
                            profileDTO.setGender(profile.getGender());
                            profileDTO.setAge(profile.getAge());
                            enriched.setUserProfile(profileDTO);
                        }
                        
                        // Convert bio directly from entity
                        UserBio bio = user.getBio();
                        if (bio != null) {
                            UserBioDTO bioDTO = new UserBioDTO();
                            bioDTO.setId(bio.getId());
                            
                            // Convert interests to DTOs
                            if (bio.getInterests() != null) {
                                Set<InterestDTO> interestDTOs = bio.getInterests().stream()
                                    .map(InterestDTO::new)
                                    .collect(Collectors.toSet());
                                bioDTO.setInterests(interestDTOs);
                            }
                            
                            bioDTO.setFavouriteCuisine(bio.getFavouriteCuisine());
                            bioDTO.setFavouriteMusicGenre(bio.getFavouriteMusicGenre());
                            bioDTO.setPetPreference(bio.getPetPreference());
                            bioDTO.setLookingFor(bio.getLookingFor());
                            bioDTO.setPriorityTraits(bio.getPriorityTraits());
                            enriched.setUserBio(bioDTO);
                        }
                    }
                } catch (RuntimeException e) {
                    // If user details can't be fetched, still return the basic match info
                    System.err.println("Error fetching user details for user " + match.getLikedId() + ": " + e.getMessage());
                }
                
                return enriched;
            })
            .collect(Collectors.toList());
    }

    public boolean areUsersMatched(Long userId1, Long userId2) {
        // Check if user1 likes user2 AND user2 likes user1
        boolean user1LikesUser2 = userLikeRepository.findByLikerIdAndLikedId(userId1, userId2)
            .map(UserLike::isLike)
            .orElse(false);
            
        boolean user2LikesUser1 = userLikeRepository.findByLikerIdAndLikedId(userId2, userId1)
            .map(UserLike::isLike)
            .orElse(false);
            
        return user1LikesUser2 && user2LikesUser1;
    }

    private UserLikeDTO convertToDTO(UserLike userLike) {
        User liker = userLike.getLiker();
        User liked = userLike.getLiked();
        
        String likerDisplayName = liker.getProfile() != null ? liker.getProfile().getDisplayName() : "User " + liker.getId();
        String likedDisplayName = liked.getProfile() != null ? liked.getProfile().getDisplayName() : "User " + liked.getId();
        
        UserLikeDTO dto = new UserLikeDTO();
        dto.setId(userLike.getId());
        dto.setLikerId(liker.getId());
        dto.setLikedId(liked.getId());
        dto.setLikerDisplayName(likerDisplayName);
        dto.setLikedDisplayName(likedDisplayName);
        dto.setLike(userLike.isLike());
        
        return dto;
    }
}

class MatchNotification {
    private String matchedUserName;
    private Long matchedUserId;
    private String message;

    public MatchNotification(String matchedUserName, Long matchedUserId) {
        this.matchedUserName = matchedUserName;
        this.matchedUserId = matchedUserId;
        this.message = "You have a new match with " + matchedUserName + "!";
    }

    // Getters and setters
    public String getMatchedUserName() { return matchedUserName; }
    public void setMatchedUserName(String matchedUserName) { this.matchedUserName = matchedUserName; }
    public Long getMatchedUserId() { return matchedUserId; }
    public void setMatchedUserId(Long matchedUserId) { this.matchedUserId = matchedUserId; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
} 

