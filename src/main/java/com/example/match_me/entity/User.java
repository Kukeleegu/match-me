package com.example.match_me.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    /* ---------- fields ---------- */

    @Id
    @Column(name = "id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String email;

    private String password;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL,fetch = FetchType.LAZY, optional = false)
    private UserProfile profile;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL,fetch = FetchType.LAZY, optional = false)
    private UserBio bio;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY, optional = false)
    private UserPreferences preferences;

    /* ---------- constructors ---------- */

    public User() { }   // JPA needs a no-arg constructor

    public User(String email, String password) {
        this.email = email;
        this.password = password;
    }

    /* ---------- getters / setters ---------- */

    public Long getId()            { return id; }
    public void setId(Long id)     { this.id = id; }

    public String getEmail()       { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword(){ return password; }
    public void setPassword(String password) { this.password = password; }

    public UserProfile getProfile(){ return profile; }
    public void setProfile(UserProfile p){ this.profile = p; }

    public UserBio getBio()        { return bio; }
    public void setBio(UserBio b)  { this.bio = b; }

    public UserPreferences getPreferences() { return preferences; }
    public void setPreferences(UserPreferences p) { this.preferences = p; }
}
