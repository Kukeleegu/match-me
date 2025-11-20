package com.example.match_me.DTO;

import com.example.match_me.entity.UserProfile.Gender;
import java.time.Instant;

public class UpdateProfileRequest {
    private String displayName;
    private String aboutMe;
    private String county;
    private Instant lastSeen;
    private Gender gender;
    private Integer age;

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getAboutMe() { return aboutMe; }
    public void setAboutMe(String aboutMe) { this.aboutMe = aboutMe; }

    public String getCounty() { return county; }
    public void setCounty(String county) { this.county = county; }

    public Instant getLastSeen() { return lastSeen; }
    public void setLastSeen(Instant lastSeen) { this.lastSeen = lastSeen; }

    public Gender getGender() { return gender; }
    public void setGender(Gender gender) { this.gender = gender; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
} 
