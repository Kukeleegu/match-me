package com.example.match_me.entity;

import jakarta.persistence.*;
import java.util.Set;

@Entity
@Table(name = "user_preferences")
public class UserPreferences {

    @Id
    private Long id;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id")
    private User user;

    private Integer minAge;
    private Integer maxAge;
    
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "preferred_genders", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "gender")
    private Set<UserProfile.Gender> preferredGenders;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "preferred_counties", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "county")
    private Set<String> preferredCounties;

    /* ---------- constructors ---------- */

    public UserPreferences() { }

    /* ---------- getters / setters ---------- */

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Integer getMinAge() { return minAge; }
    public void setMinAge(Integer minAge) { this.minAge = minAge; }

    public Integer getMaxAge() { return maxAge; }
    public void setMaxAge(Integer maxAge) { this.maxAge = maxAge; }

    public Set<UserProfile.Gender> getPreferredGenders() { return preferredGenders; }
    public void setPreferredGenders(Set<UserProfile.Gender> preferredGenders) { this.preferredGenders = preferredGenders; }

    public Set<String> getPreferredCounties() { return preferredCounties; }
    public void setPreferredCounties(Set<String> preferredCounties) { this.preferredCounties = preferredCounties; }
} 