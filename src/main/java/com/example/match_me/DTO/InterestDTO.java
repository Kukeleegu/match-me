package com.example.match_me.DTO;

import com.example.match_me.entity.Interest;

public class InterestDTO {
    private Long id;
    private String name;
    private Interest.InterestType type;
    private String category;
    private Interest.SocialType socialType;
    private Boolean physical;
    private Interest.MoodType mood;

    public InterestDTO() { }

    public InterestDTO(Interest interest) {
        this.id = interest.getId();
        this.name = interest.getName();
        this.type = interest.getType();
        this.category = interest.getCategory();
        this.socialType = interest.getSocialType();
        this.physical = interest.getPhysical();
        this.mood = interest.getMood();
    }

    /* ---------- getters / setters ---------- */

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Interest.InterestType getType() { return type; }
    public void setType(Interest.InterestType type) { this.type = type; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Interest.SocialType getSocialType() { return socialType; }
    public void setSocialType(Interest.SocialType socialType) { this.socialType = socialType; }

    public Boolean getPhysical() { return physical; }
    public void setPhysical(Boolean physical) { this.physical = physical; }

    public Interest.MoodType getMood() { return mood; }
    public void setMood(Interest.MoodType mood) { this.mood = mood; }
} 