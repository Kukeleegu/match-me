package com.example.match_me.DTO;

import com.example.match_me.entity.UserProfile.Gender;
import java.util.Set;

public class UserPreferencesDTO {
    private Long id;
    private Integer minAge;
    private Integer maxAge;
    private Set<Gender> preferredGenders;
    private Set<String> preferredCounties;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getMinAge() { return minAge; }
    public void setMinAge(Integer minAge) { this.minAge = minAge; }

    public Integer getMaxAge() { return maxAge; }
    public void setMaxAge(Integer maxAge) { this.maxAge = maxAge; }

    public Set<Gender> getPreferredGenders() { return preferredGenders; }
    public void setPreferredGenders(Set<Gender> preferredGenders) { this.preferredGenders = preferredGenders; }

    public Set<String> getPreferredCounties() { return preferredCounties; }
    public void setPreferredCounties(Set<String> preferredCounties) { this.preferredCounties = preferredCounties; }
} 