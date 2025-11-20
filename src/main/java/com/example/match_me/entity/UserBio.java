package com.example.match_me.entity;


import jakarta.persistence.*;

import java.util.Set;

@Entity
@Table(name = "user_bios")
public class UserBio {

    @Id
    private Long id;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id")
    private User user;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "user_interests",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "interest_id")
    )
    private Set<Interest> interests;

    private String favouriteCuisine;
    private String favouriteMusicGenre;
    private String petPreference;
    private String lookingFor;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "user_priority_traits",joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "trait")
    private Set<String> priorityTraits;

    /* ---------- constructors ---------- */

    public UserBio() { }

    /* Add other constructors as needed */

    /* ---------- getters / setters ---------- */

    public Long getId()                      { return id; }
    public void setId(Long id)               { this.id = id; }

    public User getUser()                    { return user; }
    public void setUser(User user)           { this.user = user; }

    public Set<Interest> getInterests()      { return interests; }
    public void setInterests(Set<Interest> interests) { this.interests = interests; }

    public String getFavouriteCuisine()      { return favouriteCuisine; }
    public void setFavouriteCuisine(String f){ this.favouriteCuisine = f; }

    public String getFavouriteMusicGenre()   { return favouriteMusicGenre; }
    public void setFavouriteMusicGenre(String g){ this.favouriteMusicGenre = g; }

    public String getPetPreference()         { return petPreference; }
    public void setPetPreference(String p)   { this.petPreference = p; }

    public String getLookingFor()            { return lookingFor; }
    public void setLookingFor(String l)      { this.lookingFor = l; }

    public Set<String> getPriorityTraits()   { return priorityTraits; }
    public void setPriorityTraits(Set<String> t){ this.priorityTraits = t; }
}
