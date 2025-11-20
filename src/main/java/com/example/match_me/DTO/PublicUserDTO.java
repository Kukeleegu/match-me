package com.example.match_me.DTO;

public class PublicUserDTO {
    private Long id;
    private UserProfileDTO profile;
    private UserBioDTO bio;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public UserProfileDTO getProfile() { return profile; }
    public void setProfile(UserProfileDTO profile) { this.profile = profile; }

    public UserBioDTO getBio() { return bio; }
    public void setBio(UserBioDTO bio) { this.bio = bio; }
}
