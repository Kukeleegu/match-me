package com.example.match_me.service;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.match_me.DTO.BasicUserDTO;
import com.example.match_me.DTO.InterestDTO;
import com.example.match_me.DTO.PublicUserDTO;
import com.example.match_me.DTO.UpdateBioRequest;
import com.example.match_me.DTO.UpdatePreferencesRequest;
import com.example.match_me.DTO.UpdateProfileRequest;
import com.example.match_me.DTO.UserBioDTO;
import com.example.match_me.DTO.UserDTO;
import com.example.match_me.DTO.UserMatchDTO;
import com.example.match_me.DTO.UserPreferencesDTO;
import com.example.match_me.DTO.UserProfileDTO;
import com.example.match_me.entity.Interest;
import com.example.match_me.entity.User;
import com.example.match_me.entity.UserBio;
import com.example.match_me.entity.UserPreferences;
import com.example.match_me.entity.UserProfile;
import com.example.match_me.repository.InterestRepository;
import com.example.match_me.repository.UserLikeRepository;
import com.example.match_me.repository.UserRepository;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final InterestRepository interestRepository;
    private final UserLikeRepository userLikeRepository;
    
    @Autowired
    public UserService(UserRepository userRepository, InterestRepository interestRepository, UserLikeRepository userLikeRepository) {
        this.userRepository = userRepository;
        this.interestRepository = interestRepository;
        this.userLikeRepository = userLikeRepository;
    }
    //this will use authentication manager to get the current user from spring security context (which is set in the auth controller)
    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        return user;
    }

    public User getUserByEmail(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new RuntimeException("User not found with email: " + email);
        }
        return user;
    }

    public UserDTO getCurrentUserDTO() {
        User user = getCurrentUser();
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setProfile(getProfile(user.getId()));
        dto.setBio(getBio(user.getId()));
        return dto;
    }

    public UserProfileDTO getCurrentUserProfile() {
        User user = getCurrentUser();
        return getProfile(user.getId());
    }

    public UserProfileDTO getProfile(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        UserProfile profile = user.getProfile();
        if (profile == null) {
            return null;
        }
        UserProfileDTO dto = new UserProfileDTO();
        dto.setId(profile.getId());
        dto.setDisplayName(profile.getDisplayName());
        dto.setAboutMe(profile.getAboutMe());
        dto.setCounty(profile.getCounty());
        dto.setLastSeen(profile.getLastSeen());
        dto.setGender(profile.getGender());
        dto.setAge(profile.getAge());
        return dto;
    }

    public BasicUserDTO getBasicUser(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        UserProfile profile = user.getProfile();
        
        String displayName = profile != null ? profile.getDisplayName() : "User " + userId;
        String profileLink = "/users/" + userId;
        
        return new BasicUserDTO(userId, displayName, profileLink);
    }

    public UserBioDTO getCurrentUserBio() {
        User user = getCurrentUser();
        return getBio(user.getId());
    }

    public PublicUserDTO getUser(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        PublicUserDTO dto = new PublicUserDTO();
        dto.setId(user.getId());
        dto.setProfile(getProfile(userId));
        dto.setBio(getBio(userId));
        return dto;
    }

    public List<PublicUserDTO> getAllUsers() {
        List<User> users = userRepository.findAll();
        return users.stream()
            .map(user -> {
                PublicUserDTO dto = new PublicUserDTO();
                dto.setId(user.getId());
                dto.setProfile(getProfile(user.getId()));
                dto.setBio(getBio(user.getId()));
                return dto;
            })
            .collect(Collectors.toList());
    }

    public UserBioDTO getBio(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        UserBio bio = user.getBio();
        if (bio == null) {
            return null;
        }
        UserBioDTO dto = new UserBioDTO();
        dto.setId(bio.getId());
        
        // Convert interests to DTOs
        if (bio.getInterests() != null) {
            Set<InterestDTO> interestDTOs = bio.getInterests().stream()
                .map(InterestDTO::new)
                .collect(Collectors.toSet());
            dto.setInterests(interestDTOs);
        }
        
        dto.setFavouriteCuisine(bio.getFavouriteCuisine());
        dto.setFavouriteMusicGenre(bio.getFavouriteMusicGenre());
        dto.setPetPreference(bio.getPetPreference());
        dto.setLookingFor(bio.getLookingFor());
        dto.setPriorityTraits(bio.getPriorityTraits());
        return dto;
    }

    @Transactional
    public void updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        UserProfile profile = user.getProfile();
        if (profile == null) {
            profile = new UserProfile();
            profile.setUser(user);
            user.setProfile(profile);
        }
        profile.setDisplayName(request.getDisplayName());
        profile.setAboutMe(request.getAboutMe());
        if (request.getCounty() != null) profile.setCounty(request.getCounty());
        if (request.getLastSeen() != null) profile.setLastSeen(request.getLastSeen());
        if (request.getGender() != null) profile.setGender(request.getGender());
        if (request.getAge() != null) profile.setAge(request.getAge());
        userRepository.save(user);
    }

    @Transactional
    public void updateBio(Long userId, UpdateBioRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        UserBio bio = user.getBio();
        if (bio == null) {
            bio = new UserBio();
            bio.setUser(user);
            user.setBio(bio);
        }
        
        // Handle interests
        if (request.getInterestIds() != null) {
            Set<Interest> interests = interestRepository.findByIdIn(request.getInterestIds());
            bio.setInterests(interests);
        }
        
        bio.setFavouriteCuisine(request.getFavouriteCuisine());
        bio.setFavouriteMusicGenre(request.getFavouriteMusicGenre());
        bio.setPetPreference(request.getPetPreference());
        bio.setLookingFor(request.getLookingFor());
        bio.setPriorityTraits(request.getPriorityTraits());
        userRepository.save(user);
    }

    public UserPreferencesDTO getCurrentUserPreferences() {
        User user = getCurrentUser();
        return getPreferences(user.getId());
    }

    public UserPreferencesDTO getPreferences(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        UserPreferences preferences = user.getPreferences();
        if (preferences == null) {
            return null;
        }
        UserPreferencesDTO dto = new UserPreferencesDTO();
        dto.setId(preferences.getId());
        dto.setMinAge(preferences.getMinAge());
        dto.setMaxAge(preferences.getMaxAge());
        dto.setPreferredGenders(preferences.getPreferredGenders());
        dto.setPreferredCounties(preferences.getPreferredCounties());
        return dto;
    }

    @Transactional
    public void updatePreferences(Long userId, UpdatePreferencesRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        UserPreferences preferences = user.getPreferences();
        if (preferences == null) {
            preferences = new UserPreferences();
            preferences.setUser(user);
            user.setPreferences(preferences);
        }
        preferences.setMinAge(request.getMinAge());
        preferences.setMaxAge(request.getMaxAge());
        preferences.setPreferredGenders(request.getPreferredGenders());
        preferences.setPreferredCounties(request.getPreferredCounties());
        userRepository.save(user);
    }

    public List<PublicUserDTO> getFilteredUsers(Integer minAge, Integer maxAge, Set<UserProfile.Gender> genders, Set<String> counties) {
        List<User> users = userRepository.findAll();
        return users.stream()
            .map(user -> {
                PublicUserDTO dto = new PublicUserDTO();
                dto.setId(user.getId());
                dto.setProfile(getProfile(user.getId()));
                dto.setBio(getBio(user.getId()));
                return dto;
            })
            .filter(dto -> {
                //if filter return true, the user will be included in the filtered list
                UserProfileDTO profile = dto.getProfile();
                if (profile == null) return false;

                // Filter by age
                if (minAge != null && (profile.getAge() == null || profile.getAge() < minAge)) {
                    return false;
                }
                if (maxAge != null && (profile.getAge() == null || profile.getAge() > maxAge)) {
                    return false;
                }

                // Filter by gender
                if (genders != null && !genders.isEmpty() && 
                    (profile.getGender() == null || !genders.contains(profile.getGender()))) {
                    return false;
                }

                // Filter by county
                if (counties != null && !counties.isEmpty() && 
                    (profile.getCounty() == null || !counties.contains(profile.getCounty()))) {
                    return false;
                }

                return true;
            })
            .collect(Collectors.toList());
    }
    
    public List<UserMatchDTO> getMatchedUsers() {
        User currentUser = getCurrentUser();
        UserBioDTO currentUserBio = getBio(currentUser.getId());
        UserProfileDTO currentUserProfile = getProfile(currentUser.getId());
        UserPreferencesDTO currentUserPrefs = getPreferences(currentUser.getId());
        
        // Get all users the current user has already interacted with
        List<Long> interactedUserIds = userLikeRepository.findInteractedUserIdsByLiker(currentUser);
        
        List<User> users = userRepository.findAll();
        
        List<UserMatchDTO> matchedUsers = users.stream()
            .filter(user -> user.getId() != currentUser.getId()) // Exclude current user
            .filter(user -> !interactedUserIds.contains(user.getId())) // Exclude already interacted users
            .map(user -> {
                PublicUserDTO dto = new PublicUserDTO();
                dto.setId(user.getId());
                dto.setProfile(getProfile(user.getId()));
                dto.setBio(getBio(user.getId()));
                return dto;
            })
            .filter(dto -> {
                // Basic filtering based on current user's preferences
                UserProfileDTO profile = dto.getProfile();
                
                if (profile == null) {
                    return false;
                }
                
                if (currentUserPrefs != null) {
                    // Filter by age preference
                    if (currentUserPrefs.getMinAge() != null && 
                        (profile.getAge() == null || profile.getAge() < currentUserPrefs.getMinAge())) {
                        return false;
                    }
                    if (currentUserPrefs.getMaxAge() != null && 
                        (profile.getAge() == null || profile.getAge() > currentUserPrefs.getMaxAge())) {
                        return false;
                    }
                    
                    // Filter by gender preference
                    if (currentUserPrefs.getPreferredGenders() != null && 
                        !currentUserPrefs.getPreferredGenders().isEmpty() && 
                        (profile.getGender() == null || !currentUserPrefs.getPreferredGenders().contains(profile.getGender()))) {
                        return false;
                    }
                    
                    // Filter by county preference
                    if (currentUserPrefs.getPreferredCounties() != null && 
                        !currentUserPrefs.getPreferredCounties().isEmpty() && 
                        (profile.getCounty() == null || !currentUserPrefs.getPreferredCounties().contains(profile.getCounty()))) {
                        return false;
                    }
                }
                
                return true;
            })
            .map(dto -> {
                double matchScore = calculateCompatibilityScore(currentUserBio, currentUserProfile, dto.getBio(), dto.getProfile());
                UserMatchDTO matchDTO = new UserMatchDTO(dto, matchScore);
                matchDTO.setMatchDetails(generateMatchDetails(currentUserBio, currentUserProfile, dto.getBio(), dto.getProfile()));
                return matchDTO;
            })
            .filter(matchDTO -> matchDTO.getMatchScore() > 0) // Exclude matches with 0 compatibility score
            .sorted((a, b) -> Double.compare(b.getMatchScore(), a.getMatchScore())) // Sort by match score descending
            .collect(Collectors.toList());
        
        return matchedUsers;
    }
    
    private double calculateCompatibilityScore(UserBioDTO currentUserBio, UserProfileDTO currentUserProfile,
                                             UserBioDTO otherUserBio, UserProfileDTO otherUserProfile) {
        double score = 0.0;
        int totalCriteria = 0;
        
        if (currentUserBio != null && otherUserBio != null) {
            // Check interests match (weight: 3)
            if (currentUserBio.getInterests() != null && otherUserBio.getInterests() != null) {
                totalCriteria += 3;
                Set<String> currentInterestNames = currentUserBio.getInterests().stream()
                    .map(InterestDTO::getName)
                    .collect(Collectors.toSet());
                Set<String> otherInterestNames = otherUserBio.getInterests().stream()
                    .map(InterestDTO::getName)
                    .collect(Collectors.toSet());
                
                long commonInterests = currentInterestNames.stream()
                    .filter(otherInterestNames::contains)
                    .count();
                if (commonInterests > 0) {
                    score += 3.0 * (double) commonInterests / Math.max(currentInterestNames.size(), otherInterestNames.size());
                }
            }
            
            // Check priority traits match (weight: 2)
            if (currentUserBio.getPriorityTraits() != null && otherUserBio.getPriorityTraits() != null) {
                totalCriteria += 2;
                long commonTraits = currentUserBio.getPriorityTraits().stream()
                    .filter(trait -> otherUserBio.getPriorityTraits().contains(trait))
                    .count();
                if (commonTraits > 0) {
                    score += 2.0 * (double) commonTraits / Math.max(currentUserBio.getPriorityTraits().size(), otherUserBio.getPriorityTraits().size());
                }
            }
            
            // Check cuisine preference match (weight: 1)
            if (currentUserBio.getFavouriteCuisine() != null && otherUserBio.getFavouriteCuisine() != null) {
                totalCriteria += 1;
                if (currentUserBio.getFavouriteCuisine().equalsIgnoreCase(otherUserBio.getFavouriteCuisine())) {
                    score += 1.0;
                }
            }
            
            // Check music genre match (weight: 1)
            if (currentUserBio.getFavouriteMusicGenre() != null && otherUserBio.getFavouriteMusicGenre() != null) {
                totalCriteria += 1;
                if (currentUserBio.getFavouriteMusicGenre().equalsIgnoreCase(otherUserBio.getFavouriteMusicGenre())) {
                    score += 1.0;
                }
            }
            
            // Check pet preference match (weight: 1)
            if (currentUserBio.getPetPreference() != null && otherUserBio.getPetPreference() != null) {
                totalCriteria += 1;
                if (currentUserBio.getPetPreference().equalsIgnoreCase(otherUserBio.getPetPreference())) {
                    score += 1.0;
                }
            }
            
            // Check looking for match (weight: 2)
            if (currentUserBio.getLookingFor() != null && otherUserBio.getLookingFor() != null) {
                totalCriteria += 2;
                if (currentUserBio.getLookingFor().equalsIgnoreCase(otherUserBio.getLookingFor())) {
                    score += 2.0;
                }
            }
        }
        
        if (currentUserProfile != null && otherUserProfile != null) {
            // Check county match (weight: 1)
            if (currentUserProfile.getCounty() != null && otherUserProfile.getCounty() != null) {
                totalCriteria += 1;
                if (currentUserProfile.getCounty().equalsIgnoreCase(otherUserProfile.getCounty())) {
                    score += 1.0;
                }
            }
        }
        
        // Return percentage match (0-100)
        return totalCriteria > 0 ? (score / totalCriteria) * 100 : 0.0;
    }
    
    private String generateMatchDetails(UserBioDTO currentUserBio, UserProfileDTO currentUserProfile,
                                      UserBioDTO otherUserBio, UserProfileDTO otherUserProfile) {
        List<String> matches = new java.util.ArrayList<>();
        
        if (currentUserBio != null && otherUserBio != null) {
            // Common interests
            if (currentUserBio.getInterests() != null && otherUserBio.getInterests() != null) {
                Set<String> currentInterestNames = currentUserBio.getInterests().stream()
                    .map(InterestDTO::getName)
                    .collect(Collectors.toSet());
                Set<String> otherInterestNames = otherUserBio.getInterests().stream()
                    .map(InterestDTO::getName)
                    .collect(Collectors.toSet());
                
                List<String> commonInterests = currentInterestNames.stream()
                    .filter(otherInterestNames::contains)
                    .collect(Collectors.toList());
                if (!commonInterests.isEmpty()) {
                    matches.add("Common interests: " + String.join(", ", commonInterests));
                }
            }
            
            // Common traits
            if (currentUserBio.getPriorityTraits() != null && otherUserBio.getPriorityTraits() != null) {
                List<String> commonTraits = currentUserBio.getPriorityTraits().stream()
                    .filter(trait -> otherUserBio.getPriorityTraits().contains(trait))
                    .collect(Collectors.toList());
                if (!commonTraits.isEmpty()) {
                    matches.add("Common traits: " + String.join(", ", commonTraits));
                }
            }
            
            // Other matches
            if (currentUserBio.getFavouriteCuisine() != null && otherUserBio.getFavouriteCuisine() != null &&
                currentUserBio.getFavouriteCuisine().equalsIgnoreCase(otherUserBio.getFavouriteCuisine())) {
                matches.add("Same favorite cuisine: " + currentUserBio.getFavouriteCuisine());
            }
            
            if (currentUserBio.getFavouriteMusicGenre() != null && otherUserBio.getFavouriteMusicGenre() != null &&
                currentUserBio.getFavouriteMusicGenre().equalsIgnoreCase(otherUserBio.getFavouriteMusicGenre())) {
                matches.add("Same favorite music: " + currentUserBio.getFavouriteMusicGenre());
            }
            
            if (currentUserBio.getPetPreference() != null && otherUserBio.getPetPreference() != null &&
                currentUserBio.getPetPreference().equalsIgnoreCase(otherUserBio.getPetPreference())) {
                matches.add("Same pet preference: " + currentUserBio.getPetPreference());
            }
            
            if (currentUserBio.getLookingFor() != null && otherUserBio.getLookingFor() != null &&
                currentUserBio.getLookingFor().equalsIgnoreCase(otherUserBio.getLookingFor())) {
                matches.add("Looking for the same thing: " + currentUserBio.getLookingFor());
            }
        }
        
        if (currentUserProfile != null && otherUserProfile != null) {
            if (currentUserProfile.getCounty() != null && otherUserProfile.getCounty() != null &&
                currentUserProfile.getCounty().equalsIgnoreCase(otherUserProfile.getCounty())) {
                matches.add("Same county: " + currentUserProfile.getCounty());
            }
        }
        
        return matches.isEmpty() ? "No specific matches found" : String.join("; ", matches);
    }

    public UserMatchDTO getNextMatchedUser() {
        User currentUser = getCurrentUser();
        UserBioDTO currentUserBio = getBio(currentUser.getId());
        UserProfileDTO currentUserProfile = getProfile(currentUser.getId());
        UserPreferencesDTO currentUserPrefs = getPreferences(currentUser.getId());
        
        // Get all users the current user has already interacted with
        List<Long> interactedUserIds = userLikeRepository.findInteractedUserIdsByLiker(currentUser);
        
        List<User> users = userRepository.findAll();

        // Find the best match directly without building entire list
        Optional<UserMatchDTO> bestMatch = users.stream()
            .filter(user -> user.getId() != currentUser.getId()) // Exclude current user
            .filter(user -> !interactedUserIds.contains(user.getId())) // Exclude already interacted users
            .map(user -> {
                PublicUserDTO dto = new PublicUserDTO();
                dto.setId(user.getId());
                dto.setProfile(getProfile(user.getId()));
                dto.setBio(getBio(user.getId()));
                return dto;
            })
            .filter(dto -> {
                // Basic filtering based on current user's preferences
                UserProfileDTO profile = dto.getProfile();
                
                if (profile == null) {
                    return false;
                }
                
                if (currentUserPrefs != null) {
                    // Filter by age preference
                    if (currentUserPrefs.getMinAge() != null && 
                        (profile.getAge() == null || profile.getAge() < currentUserPrefs.getMinAge())) {
                        return false;
                    }
                    if (currentUserPrefs.getMaxAge() != null && 
                        (profile.getAge() == null || profile.getAge() > currentUserPrefs.getMaxAge())) {
                        return false;
                    }
                    
                    // Filter by gender preference
                    if (currentUserPrefs.getPreferredGenders() != null && 
                        !currentUserPrefs.getPreferredGenders().isEmpty() && 
                        (profile.getGender() == null || !currentUserPrefs.getPreferredGenders().contains(profile.getGender()))) {
                        return false;
                    }
                    
                    // Filter by county preference
                    if (currentUserPrefs.getPreferredCounties() != null && 
                        !currentUserPrefs.getPreferredCounties().isEmpty() && 
                        (profile.getCounty() == null || !currentUserPrefs.getPreferredCounties().contains(profile.getCounty()))) {
                        return false;
                    }
                }
                
                return true;
            })
            .map(dto -> {
                double matchScore = calculateCompatibilityScore(currentUserBio, currentUserProfile, dto.getBio(), dto.getProfile());
                UserMatchDTO matchDTO = new UserMatchDTO(dto, matchScore);
                matchDTO.setMatchDetails(generateMatchDetails(currentUserBio, currentUserProfile, dto.getBio(), dto.getProfile()));
                return matchDTO;
            })
            .max((a, b) -> Double.compare(a.getMatchScore(), b.getMatchScore())); // Find the best match
        
        return bestMatch.orElse(null);
    }

    public int getMatchedUsersCount() {
        User currentUser = getCurrentUser();
        UserPreferencesDTO currentUserPrefs = getPreferences(currentUser.getId());
        
        // Get all users the current user has already interacted with
        List<Long> interactedUserIds = userLikeRepository.findInteractedUserIdsByLiker(currentUser);
        
        List<User> users = userRepository.findAll();
        
        long count = users.stream()
            .filter(user -> user.getId() != currentUser.getId()) // Exclude current user
            .filter(user -> !interactedUserIds.contains(user.getId())) // Exclude already interacted users
            .map(user -> {
                PublicUserDTO dto = new PublicUserDTO();
                dto.setId(user.getId());
                dto.setProfile(getProfile(user.getId()));
                dto.setBio(getBio(user.getId()));
                return dto;
            })
            .filter(dto -> {
                // Basic filtering based on current user's preferences
                UserProfileDTO profile = dto.getProfile();
                
                if (profile == null) {
                    return false;
                }
                
                if (currentUserPrefs != null) {
                    // Filter by age preference
                    if (currentUserPrefs.getMinAge() != null && 
                        (profile.getAge() == null || profile.getAge() < currentUserPrefs.getMinAge())) {
                        return false;
                    }
                    if (currentUserPrefs.getMaxAge() != null && 
                        (profile.getAge() == null || profile.getAge() > currentUserPrefs.getMaxAge())) {
                        return false;
                    }
                    
                    // Filter by gender preference
                    if (currentUserPrefs.getPreferredGenders() != null && 
                        !currentUserPrefs.getPreferredGenders().isEmpty() && 
                        (profile.getGender() == null || !currentUserPrefs.getPreferredGenders().contains(profile.getGender()))) {
                        return false;
                    }
                    
                    // Filter by county preference
                    if (currentUserPrefs.getPreferredCounties() != null && 
                        !currentUserPrefs.getPreferredCounties().isEmpty() && 
                        (profile.getCounty() == null || !currentUserPrefs.getPreferredCounties().contains(profile.getCounty()))) {
                        return false;
                    }
                }
                
                return true;
            })
            .count();
        
        return (int) count;
    }
} 
