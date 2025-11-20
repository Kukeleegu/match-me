package com.example.match_me.service;

import java.time.Instant;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.match_me.entity.Interest;
import com.example.match_me.entity.User;
import com.example.match_me.entity.UserBio;
import com.example.match_me.entity.UserPreferences;
import com.example.match_me.entity.UserProfile;
import com.example.match_me.repository.InterestRepository;
import com.example.match_me.repository.UserRepository;

@Service
public class DataInitializationService implements CommandLineRunner {

    @Autowired
    private InterestRepository interestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Sample data arrays
    private static final String[] FIRST_NAMES = {
        "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn", "Blake", "Cameron",
        "Emma", "Liam", "Olivia", "Noah", "Ava", "Oliver", "Isabella", "William", "Sophia", "Elijah",
        "Charlotte", "James", "Amelia", "Benjamin", "Mia", "Lucas", "Harper", "Henry", "Evelyn", "Alexander",
        "Abigail", "Mason", "Emily", "Michael", "Elizabeth", "Ethan", "Sofia", "Daniel", "Avery", "Jacob",
        "Ella", "Logan", "Madison", "Jackson", "Scarlett", "Levi", "Victoria", "Sebastian", "Aria", "Mateo"
    };

    private static final String[] ESTONIAN_COUNTIES = {
        "Harju maakond", "Hiiu maakond", "Ida-Viru maakond", "Jõgeva maakond", "Järva maakond",
        "Lääne maakond", "Lääne-Viru maakond", "Põlva maakond", "Pärnu maakond", "Rapla maakond",
        "Saare maakond", "Tartu maakond", "Valga maakond", "Viljandi maakond", "Võru maakond"
    };

    private static final String[] CUISINES = {
        "Italian", "Mexican", "Japanese", "Thai", "Indian", "Chinese", "Mediterranean", "French",
        "Greek", "Korean", "Vietnamese", "Spanish", "Middle Eastern", "American", "Brazilian"
    };

    private static final String[] MUSIC_GENRES = {
        "Pop", "Rock", "Hip-Hop", "Jazz", "Classical", "Electronic", "Folk", "Country", "R&B",
        "Indie", "Alternative", "Blues", "Reggae", "Punk", "Metal", "Ambient", "World Music"
    };

    private static final String[] PET_PREFERENCES = {
        "Dogs", "Cats", "Both", "Neither", "Birds", "Fish", "Reptiles", "Small mammals"
    };

    private static final String[] LOOKING_FOR = {
        "Long-term relationship", "Casual dating", "Friendship", "Activity partner", 
        "Travel companion", "Someone to explore the city with", "Life partner", "Fun connections"
    };

    private static final String[] PRIORITY_TRAITS = {
        "Humor", "Intelligence", "Kindness", "Honesty", "Adventure", "Creativity", "Ambition",
        "Loyalty", "Empathy", "Communication", "Reliability", "Spontaneity", "Passion", "Stability"
    };

    private static final String[] ABOUT_ME_TEMPLATES = {
        "Love exploring new places and trying different cuisines. Always up for an adventure!",
        "Passionate about music and art. Looking for someone who appreciates the finer things in life.",
        "Outdoor enthusiast who enjoys hiking and camping. Let's explore nature together!",
        "Bookworm and coffee lover. Perfect weekend involves a good book and great conversation.",
        "Fitness enthusiast who loves staying active. Balance is key - work hard, play harder!",
        "Creative soul with a love for photography and travel. Life is about collecting memories.",
        "Foodie who loves cooking and discovering hidden gems. Good food, good company, good times!",
        "Music lover and concert goer. Life needs a soundtrack - what's yours?",
        "Adventurous spirit who loves trying new things. Spontaneous road trips anyone?",
        "Animal lover and nature enthusiast. Dogs, hiking, and good vibes."
    };

    @Override
    public void run(String... args) throws Exception {
        if (interestRepository.count() == 0) {
            initializeInterests();
        }
        
        if (userRepository.count() <= 100) { // add 100 users if there are less than 100
            createSampleUsers();
        }
    }

    private void initializeInterests() {
        List<Interest> interests = Arrays.asList(
            // Outdoor Activities
            new Interest("Hiking", Interest.InterestType.ACTIVITY, "Outdoors", Interest.SocialType.BOTH, true, Interest.MoodType.ACTIVE),
            new Interest("Rock Climbing", Interest.InterestType.ACTIVITY, "Outdoors", Interest.SocialType.BOTH, true, Interest.MoodType.ACTIVE),
            new Interest("Camping", Interest.InterestType.ACTIVITY, "Outdoors", Interest.SocialType.BOTH, true, Interest.MoodType.RELAXED),
            new Interest("Cycling", Interest.InterestType.ACTIVITY, "Outdoors", Interest.SocialType.BOTH, true, Interest.MoodType.ACTIVE),
            new Interest("Running", Interest.InterestType.ACTIVITY, "Outdoors", Interest.SocialType.BOTH, true, Interest.MoodType.ACTIVE),
            
            // Indoor/Creative Hobbies
            new Interest("Reading", Interest.InterestType.HOBBY, "Chill", Interest.SocialType.SOLO, false, Interest.MoodType.RELAXED),
            new Interest("Painting", Interest.InterestType.HOBBY, "Creative", Interest.SocialType.SOLO, false, Interest.MoodType.CALM),
            new Interest("Drawing", Interest.InterestType.HOBBY, "Creative", Interest.SocialType.SOLO, false, Interest.MoodType.CALM),
            new Interest("Photography", Interest.InterestType.HOBBY, "Creative", Interest.SocialType.SOLO, false, Interest.MoodType.CALM),
            new Interest("Writing", Interest.InterestType.HOBBY, "Creative", Interest.SocialType.SOLO, false, Interest.MoodType.CALM),
            
            // Social Activities
            new Interest("Board Games", Interest.InterestType.HOBBY, "Social", Interest.SocialType.GROUP, false, Interest.MoodType.FUN),
            new Interest("Karaoke", Interest.InterestType.ACTIVITY, "Social", Interest.SocialType.GROUP, true, Interest.MoodType.ENERGETIC),
            new Interest("Dancing", Interest.InterestType.ACTIVITY, "Social", Interest.SocialType.BOTH, true, Interest.MoodType.ENERGETIC),
            new Interest("Cooking Together", Interest.InterestType.ACTIVITY, "Social", Interest.SocialType.GROUP, false, Interest.MoodType.FUN),
            new Interest("Movie Nights", Interest.InterestType.ACTIVITY, "Social", Interest.SocialType.GROUP, false, Interest.MoodType.RELAXED),
            
            // Sports & Fitness
            new Interest("Yoga", Interest.InterestType.ACTIVITY, "Health", Interest.SocialType.BOTH, true, Interest.MoodType.CALM),
            new Interest("Swimming", Interest.InterestType.ACTIVITY, "Health", Interest.SocialType.BOTH, true, Interest.MoodType.ACTIVE),
            new Interest("Tennis", Interest.InterestType.ACTIVITY, "Sports", Interest.SocialType.BOTH, true, Interest.MoodType.ENERGETIC),
            new Interest("Basketball", Interest.InterestType.ACTIVITY, "Sports", Interest.SocialType.GROUP, true, Interest.MoodType.ENERGETIC),
            new Interest("Gym Workouts", Interest.InterestType.ACTIVITY, "Health", Interest.SocialType.BOTH, true, Interest.MoodType.ACTIVE),
            
            // Arts & Culture
            new Interest("Museums", Interest.InterestType.ACTIVITY, "Culture", Interest.SocialType.BOTH, false, Interest.MoodType.CALM),
            new Interest("Theater", Interest.InterestType.ACTIVITY, "Culture", Interest.SocialType.BOTH, false, Interest.MoodType.CALM),
            new Interest("Concerts", Interest.InterestType.ACTIVITY, "Culture", Interest.SocialType.BOTH, false, Interest.MoodType.ENERGETIC),
            new Interest("Art Galleries", Interest.InterestType.ACTIVITY, "Culture", Interest.SocialType.BOTH, false, Interest.MoodType.CALM),
            
            // Technology & Learning
            new Interest("Coding", Interest.InterestType.HOBBY, "Tech", Interest.SocialType.SOLO, false, Interest.MoodType.CALM),
            new Interest("Gaming", Interest.InterestType.HOBBY, "Tech", Interest.SocialType.BOTH, false, Interest.MoodType.FUN),
            new Interest("Learning Languages", Interest.InterestType.HOBBY, "Learning", Interest.SocialType.BOTH, false, Interest.MoodType.CALM),
            new Interest("Podcasts", Interest.InterestType.HOBBY, "Learning", Interest.SocialType.SOLO, false, Interest.MoodType.RELAXED),
            
            // Food & Drink
            new Interest("Cooking", Interest.InterestType.HOBBY, "Food", Interest.SocialType.BOTH, false, Interest.MoodType.CALM),
            new Interest("Wine Tasting", Interest.InterestType.ACTIVITY, "Food", Interest.SocialType.BOTH, false, Interest.MoodType.RELAXED),
            new Interest("Coffee Culture", Interest.InterestType.HOBBY, "Food", Interest.SocialType.BOTH, false, Interest.MoodType.RELAXED),
            new Interest("Baking", Interest.InterestType.HOBBY, "Food", Interest.SocialType.BOTH, false, Interest.MoodType.CALM),
            
            // Music
            new Interest("Playing Guitar", Interest.InterestType.HOBBY, "Music", Interest.SocialType.BOTH, false, Interest.MoodType.CALM),
            new Interest("Playing Piano", Interest.InterestType.HOBBY, "Music", Interest.SocialType.SOLO, false, Interest.MoodType.CALM),
            new Interest("Singing", Interest.InterestType.HOBBY, "Music", Interest.SocialType.BOTH, false, Interest.MoodType.ENERGETIC),
            
            // Travel & Adventure
            new Interest("Travel", Interest.InterestType.ACTIVITY, "Adventure", Interest.SocialType.BOTH, false, Interest.MoodType.ENERGETIC),
            new Interest("Backpacking", Interest.InterestType.ACTIVITY, "Adventure", Interest.SocialType.BOTH, true, Interest.MoodType.ACTIVE),
            new Interest("Road Trips", Interest.InterestType.ACTIVITY, "Adventure", Interest.SocialType.BOTH, false, Interest.MoodType.FUN)
        );

        interestRepository.saveAll(interests);
        System.out.println("Initialized " + interests.size() + " interests");
    }

    @Transactional
    public void createSampleUsers() {
        Random random = new Random();
        List<Interest> allInterests = interestRepository.findAll();
        
        int numberOfUsers = 100; // Create 100 sample users
        
        for (int i = 0; i < numberOfUsers; i++) {
            User user = createRandomUser(i, random, allInterests);
            userRepository.save(user);
        }
        
        System.out.println("Created " + numberOfUsers + " sample users with random data");
    }

    private User createRandomUser(int index, Random random, List<Interest> allInterests) {
        // Create user with email and password
        String firstName = FIRST_NAMES[random.nextInt(FIRST_NAMES.length)];
        String email = firstName.toLowerCase() + (index + 1) + "@example.com";
        User user = new User(email, passwordEncoder.encode("password123"));

        // Create profile
        UserProfile profile = new UserProfile();
        profile.setUser(user);
        profile.setDisplayName(firstName);
        profile.setCounty(ESTONIAN_COUNTIES[random.nextInt(ESTONIAN_COUNTIES.length)]);
        profile.setAge(random.nextInt(30) + 20); // Age between 20-49
        profile.setGender(UserProfile.Gender.values()[random.nextInt(UserProfile.Gender.values().length)]);
        profile.setAboutMe(ABOUT_ME_TEMPLATES[random.nextInt(ABOUT_ME_TEMPLATES.length)]);
        profile.setLastSeen(Instant.now().minusSeconds(random.nextInt(86400 * 7))); // Last seen within a week
        user.setProfile(profile);

        // Create bio
        UserBio bio = new UserBio();
        bio.setUser(user);
        bio.setFavouriteCuisine(CUISINES[random.nextInt(CUISINES.length)]);
        bio.setFavouriteMusicGenre(MUSIC_GENRES[random.nextInt(MUSIC_GENRES.length)]);
        bio.setPetPreference(PET_PREFERENCES[random.nextInt(PET_PREFERENCES.length)]);
        bio.setLookingFor(LOOKING_FOR[random.nextInt(LOOKING_FOR.length)]);
        
        // Add random interests (3-8 interests per user)
        int numInterests = random.nextInt(6) + 3;
        Set<Interest> userInterests = new HashSet<>();
        for (int j = 0; j < numInterests; j++) {
            Interest randomInterest = allInterests.get(random.nextInt(allInterests.size()));
            userInterests.add(randomInterest);
        }
        bio.setInterests(userInterests);
        
        // Add random priority traits (2-5 traits per user)
        int numTraits = random.nextInt(4) + 2;
        Set<String> priorityTraits = new HashSet<>();
        for (int j = 0; j < numTraits; j++) {
            String trait = PRIORITY_TRAITS[random.nextInt(PRIORITY_TRAITS.length)];
            priorityTraits.add(trait);
        }
        bio.setPriorityTraits(priorityTraits);
        user.setBio(bio);

        // Create preferences
        UserPreferences preferences = new UserPreferences();
        preferences.setUser(user);
        preferences.setMinAge(random.nextInt(10) + 18); // Min age 18-27
        preferences.setMaxAge(preferences.getMinAge() + random.nextInt(20) + 5); // Max age 5-25 years older than min
        
        // Preferred genders (random selection)
        Set<UserProfile.Gender> preferredGenders = new HashSet<>();
        UserProfile.Gender[] genders = UserProfile.Gender.values();
        int numPreferredGenders = random.nextInt(genders.length) + 1;
        for (int j = 0; j < numPreferredGenders; j++) {
            preferredGenders.add(genders[random.nextInt(genders.length)]);
        }
        preferences.setPreferredGenders(preferredGenders);
        
        // Preferred counties (1-5 random Estonian counties)
        Set<String> preferredCounties = new HashSet<>();
        int numPreferredCounties = random.nextInt(5) + 1;
        for (int j = 0; j < numPreferredCounties; j++) {
            preferredCounties.add(ESTONIAN_COUNTIES[random.nextInt(ESTONIAN_COUNTIES.length)]);
        }
        preferences.setPreferredCounties(preferredCounties);
        user.setPreferences(preferences);

        return user;
    }
} 