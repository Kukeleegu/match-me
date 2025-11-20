package com.example.match_me.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "interests")
public class Interest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InterestType type;

    private String category;

    @Enumerated(EnumType.STRING)
    private SocialType socialType;

    private Boolean physical;

    @Enumerated(EnumType.STRING)
    private MoodType mood;

    public enum InterestType {
        ACTIVITY,
        HOBBY
    }

    public enum SocialType {
        SOLO,
        GROUP,
        BOTH
    }

    public enum MoodType {
        ACTIVE,
        RELAXED,
        FUN,
        CALM,
        ENERGETIC
    }

    /* ---------- constructors ---------- */

    public Interest() { }

    public Interest(String name, InterestType type) {
        this.name = name;
        this.type = type;
    }

    public Interest(String name, InterestType type, String category, SocialType socialType, Boolean physical, MoodType mood) {
        this.name = name;
        this.type = type;
        this.category = category;
        this.socialType = socialType;
        this.physical = physical;
        this.mood = mood;
    }

    /* ---------- getters / setters ---------- */

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public InterestType getType() { return type; }
    public void setType(InterestType type) { this.type = type; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public SocialType getSocialType() { return socialType; }
    public void setSocialType(SocialType socialType) { this.socialType = socialType; }

    public Boolean getPhysical() { return physical; }
    public void setPhysical(Boolean physical) { this.physical = physical; }

    public MoodType getMood() { return mood; }
    public void setMood(MoodType mood) { this.mood = mood; }

    @Override
    public String toString() {
        return "Interest{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", type=" + type +
                ", category='" + category + '\'' +
                ", socialType=" + socialType +
                ", physical=" + physical +
                ", mood=" + mood +
                '}';
    }
} 