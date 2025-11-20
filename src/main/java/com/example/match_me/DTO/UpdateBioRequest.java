package com.example.match_me.DTO;

import java.util.Set;

public class UpdateBioRequest {
    private Set<Long> interestIds;
    private String favouriteCuisine;
    private String favouriteMusicGenre;
    private String petPreference;
    private String lookingFor;
    private Set<String> priorityTraits;

    public Set<Long> getInterestIds() { return interestIds; }
    public void setInterestIds(Set<Long> interestIds) { this.interestIds = interestIds; }

    public String getFavouriteCuisine() { return favouriteCuisine; }
    public void setFavouriteCuisine(String favouriteCuisine) { this.favouriteCuisine = favouriteCuisine; }

    public String getFavouriteMusicGenre() { return favouriteMusicGenre; }
    public void setFavouriteMusicGenre(String favouriteMusicGenre) { this.favouriteMusicGenre = favouriteMusicGenre; }

    public String getPetPreference() { return petPreference; }
    public void setPetPreference(String petPreference) { this.petPreference = petPreference; }

    public String getLookingFor() { return lookingFor; }
    public void setLookingFor(String lookingFor) { this.lookingFor = lookingFor; }

    public Set<String> getPriorityTraits() { return priorityTraits; }
    public void setPriorityTraits(Set<String> priorityTraits) { this.priorityTraits = priorityTraits; }
} 
