package com.example.match_me.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "user_profiles")
public class UserProfile {

    @Id
    private Long id;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id")
    private User user;

    private String displayName;

    private String aboutMe;

    private Instant lastSeen;

    //location - Estonian county
    private String county;

    private Integer age;

    @Column(nullable = true)
    @Enumerated(EnumType.STRING)
    private Gender gender;

    public enum Gender {
        MALE,
        FEMALE,
        OTHER
    }

    /* ---------- constructors ---------- */

    public UserProfile() { }

    public UserProfile(String displayName) {
        this.displayName = displayName;
    }

    /* ---------- getters / setters ---------- */

    public Long getId()                      { return id; }
    public void setId(Long id)               { this.id = id; }

    public User getUser()                    { return user; }
    public void setUser(User user)           { this.user = user; }

    public String getDisplayName()           { return displayName; }
    public void setDisplayName(String n)     { this.displayName = n; }

    public String getAboutMe()               { return aboutMe; }
    public void setAboutMe(String aboutMe)   { this.aboutMe = aboutMe; }

    public Instant getLastSeen()             { return lastSeen; }
    public void setLastSeen(Instant t)       { this.lastSeen = t; }

    public String getCounty()                { return county; }
    public void setCounty(String county)     { this.county = county; }

    public Integer getAge()                  { return age; }
    public void setAge(Integer age)          { this.age = age; }

    public Gender getGender()                { return gender; }
    public void setGender(Gender gender)     { this.gender = gender; }
}
