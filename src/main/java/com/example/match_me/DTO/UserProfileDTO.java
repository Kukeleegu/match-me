package com.example.match_me.DTO;

import com.example.match_me.entity.UserProfile.Gender;
import java.time.Instant;

public class UserProfileDTO {
    private Long id;
    private String displayName;
    private String aboutMe;
    private Instant lastSeen;
    private String county;
    private Gender gender;
    private Integer age;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getAboutMe() { return aboutMe; }
    public void setAboutMe(String aboutMe) { this.aboutMe = aboutMe; }

    public Instant getLastSeen() { return lastSeen; }
    public void setLastSeen(Instant lastSeen) { this.lastSeen = lastSeen; }

    public String getCounty() { return county; }
    public void setCounty(String county) { this.county = county; }

    public Gender getGender() { return gender; }
    public void setGender(Gender gender) { this.gender = gender; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
}
