package com.example.match_me.controller;

import java.util.List;
import java.util.Set;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.match_me.DTO.BasicUserDTO;
import com.example.match_me.DTO.PublicUserDTO;
import com.example.match_me.DTO.UpdateBioRequest;
import com.example.match_me.DTO.UpdatePreferencesRequest;
import com.example.match_me.DTO.UpdateProfileRequest;
import com.example.match_me.DTO.UserBioDTO;
import com.example.match_me.DTO.UserDTO;
import com.example.match_me.DTO.UserMatchDTO;
import com.example.match_me.DTO.UserPreferencesDTO;
import com.example.match_me.DTO.UserProfileDTO;
import com.example.match_me.entity.User;
import com.example.match_me.entity.UserProfile;
import com.example.match_me.service.UserService;



//Authentication auth variable is the user who is currently logged in (it is a Spring Security class)
//it works by checking the JWT token in the header of the request
//if the token is valid, it will set the Authentication object in the SecurityContextHolder
//then we can get the user from the SecurityContextHolder
//securityContextHolder is a thread local variable that stores the info of all the users who are logged in

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // Get all users
    @GetMapping
    public ResponseEntity<List<PublicUserDTO>> getAllUsers() {
        try {
            return ResponseEntity.ok(userService.getAllUsers());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{userId}")
    public ResponseEntity<BasicUserDTO> getBasicUser(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(userService.getBasicUser(userId));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{userId}/profile")
    public ResponseEntity<UserProfileDTO> getProfile(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(userService.getProfile(userId));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{userId}/bio")
    public ResponseEntity<UserBioDTO> getBio(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(userService.getBio(userId));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{userId}/profile")
    public ResponseEntity<?> updateProfile(@PathVariable Long userId, @RequestBody UpdateProfileRequest request) {
        try {
            userService.updateProfile(userId, request);
            return ResponseEntity.ok("Profile updated successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{userId}/bio")
    public ResponseEntity<?> updateBio(@PathVariable Long userId, @RequestBody UpdateBioRequest request) {
        try {
            userService.updateBio(userId, request);
            return ResponseEntity.ok("Bio updated successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // @GetMapping("/me") is a shortcut to /users/{id}
    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser() {
        try {
            return ResponseEntity.ok(userService.getCurrentUserDTO());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // @GetMapping("/me/bio") is a shortcut to /users/{id}/bio
    @GetMapping("/me/bio")
    public ResponseEntity<UserBioDTO> getCurrentUserBio() {
        try {
            return ResponseEntity.ok(userService.getCurrentUserBio());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // @GetMapping("/me/profile") is a shortcut to /users/{id}/profile
    @GetMapping("/me/profile")
    public ResponseEntity<UserProfileDTO> getCurrentUserProfile() {
        try {
            return ResponseEntity.ok(userService.getCurrentUserProfile());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // @PutMapping("/me/profile") is a shortcut to /users/{id}/profile
    @PutMapping("/me/profile")
    public ResponseEntity<?> updateCurrentUserProfile(@RequestBody UpdateProfileRequest request) {
        try {
            User user = userService.getCurrentUser();
            userService.updateProfile(user.getId(), request);
            return ResponseEntity.ok("Profile updated successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // @PutMapping("/me/bio") is a shortcut to /users/{id}/bio
    @PutMapping("/me/bio")
    public ResponseEntity<?> updateCurrentUserBio(@RequestBody UpdateBioRequest request) {
        try {
            User user = userService.getCurrentUser();
            userService.updateBio(user.getId(), request);
            return ResponseEntity.ok("Bio updated successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{userId}/preferences")
    public ResponseEntity<UserPreferencesDTO> getPreferences(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(userService.getPreferences(userId));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{userId}/preferences")
    public ResponseEntity<?> updatePreferences(@PathVariable Long userId, @RequestBody UpdatePreferencesRequest request) {
        try {
            userService.updatePreferences(userId, request);
            return ResponseEntity.ok("Preferences updated successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // @GetMapping("/me/preferences") is a shortcut to /users/{id}/preferences
    @GetMapping("/me/preferences")
    public ResponseEntity<UserPreferencesDTO> getCurrentUserPreferences() {
        try {
            return ResponseEntity.ok(userService.getCurrentUserPreferences());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // @PutMapping("/me/preferences") is a shortcut to /users/{id}/preferences
    @PutMapping("/me/preferences")
    public ResponseEntity<?> updateCurrentUserPreferences(@RequestBody UpdatePreferencesRequest request) {
        try {
            User user = userService.getCurrentUser();
            userService.updatePreferences(user.getId(), request);
            return ResponseEntity.ok("Preferences updated successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/filtered")
    public ResponseEntity<List<UserMatchDTO>> getFilteredUsers() {
        try {
            return ResponseEntity.ok(userService.getMatchedUsers());
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    //basic filtered users are the users that match the current user's preferences without filtering if the user has already interacted with them
    @GetMapping("/basic-filtered")
    public ResponseEntity<List<PublicUserDTO>> getBasicFilteredUsers() {
        try {
            User user = userService.getCurrentUser();
            UserPreferencesDTO prefs = userService.getPreferences(user.getId());
            Integer minAge = prefs != null ? prefs.getMinAge() : null;
            Integer maxAge = prefs != null ? prefs.getMaxAge() : null;
            Set<UserProfile.Gender> genders = prefs != null ? prefs.getPreferredGenders() : null;
            Set<String> counties = prefs != null ? prefs.getPreferredCounties() : null;
            return ResponseEntity.ok(userService.getFilteredUsers(minAge, maxAge, genders, counties));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/next-match")
    public ResponseEntity<UserMatchDTO> getNextMatchedUser() {
        try {
            UserMatchDTO nextUser = userService.getNextMatchedUser();
            if (nextUser != null) {
                return ResponseEntity.ok(nextUser);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (RuntimeException e) {
            System.err.println("ERROR in getNextMatchedUser: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/filtered/count")
    public ResponseEntity<Integer> getMatchedUsersCount() {
        try {
            int count = userService.getMatchedUsersCount();
            return ResponseEntity.ok(count);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/recommendations")
    public ResponseEntity<List<Long>> getRecommendations() {
        try {
            List<Long> recommendationIds = userService.getMatchedUsers()
                .stream()
                .limit(10)
                .map(UserMatchDTO::getId)
                .collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(recommendationIds);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

} 
