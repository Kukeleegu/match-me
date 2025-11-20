package com.example.match_me.service;

import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.match_me.entity.User;
import com.example.match_me.entity.UserBio;
import com.example.match_me.entity.UserPreferences;
import com.example.match_me.entity.UserProfile;
import com.example.match_me.repository.UserRepository;

@Service
public class AuthService {

    private final BCryptPasswordEncoder passwordEncoder;

    private final UserRepository userRepository;

    private static final String EMAIL_REGEX = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"; // check email format with regex
    private static final Pattern EMAIL_PATTERN = Pattern.compile(EMAIL_REGEX);

    private static final String PASSWORD_REGEX = "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{6,}$"; // must be at least 6 characters long and contain at least one letter and one number
    private static final Pattern PASSWORD_PATTERN = Pattern.compile(PASSWORD_REGEX);

    @Autowired
    public AuthService(UserRepository userRepository, BCryptPasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Method to validate email
    private boolean isValidEmail(String email) {
        return EMAIL_PATTERN.matcher(email).matches();
    }

    // Method to validate password
    private boolean isValidPassword(String password) {
        return PASSWORD_PATTERN.matcher(password).matches();
    }

    //login
    public User login(String email, String password) {
        User user = userRepository.findByEmail(email);
        if (user != null && user.getPassword().equals(password)) {
            return user;
        }
        return null;
    }


    //register
    //transactional ensures either all entities are created successfully or none are
    @Transactional
    public void register(String email, String password) {
        // Validate email format
        if (!isValidEmail(email)) {
            throw new RuntimeException("Invalid email format");
        }

        // Validate password format
        if (!isValidPassword(password)) {
            throw new RuntimeException("Password must be at least 6 characters long and contain at least one letter and one number.");
        }

        // Check if user already exists
        if (userRepository.findByEmail(email) != null) {
            throw new RuntimeException("User with email " + email + " already exists");
        }
        String encodedPassword = passwordEncoder.encode(password);
        // Create user with password
        User user = new User(email, encodedPassword);
        System.out.println("user: " + user);
        
        // Create and set up profile
        UserProfile profile = new UserProfile();
        profile.setUser(user);
        user.setProfile(profile);

        // Create and set up bio
        UserBio bio = new UserBio();
        bio.setUser(user);
        user.setBio(bio);

        // Create and set up preferences
        UserPreferences preferences = new UserPreferences();
        preferences.setUser(user);
        user.setPreferences(preferences);

        // Save the user
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User with id " + userId + " not found");
        }
        userRepository.deleteById(userId);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }
} 
