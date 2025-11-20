package com.example.match_me.DTO;

public class EnrichedMatchDTO {
    private Long id;
    private Long likerId;
    private Long likedId;
    private String likerDisplayName;
    private String likedDisplayName;
    private boolean like;
    private UserProfileDTO userProfile;
    private UserBioDTO userBio;

    /* ---------- constructors ---------- */

    public EnrichedMatchDTO() {}

    public EnrichedMatchDTO(UserLikeDTO userLikeDTO) {
        this.id = userLikeDTO.getId();
        this.likerId = userLikeDTO.getLikerId();
        this.likedId = userLikeDTO.getLikedId();
        this.likerDisplayName = userLikeDTO.getLikerDisplayName();
        this.likedDisplayName = userLikeDTO.getLikedDisplayName();
        this.like = userLikeDTO.isLike();
    }

    /* ---------- getters / setters ---------- */

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getLikerId() {
        return likerId;
    }

    public void setLikerId(Long likerId) {
        this.likerId = likerId;
    }

    public Long getLikedId() {
        return likedId;
    }

    public void setLikedId(Long likedId) {
        this.likedId = likedId;
    }

    public String getLikerDisplayName() {
        return likerDisplayName;
    }

    public void setLikerDisplayName(String likerDisplayName) {
        this.likerDisplayName = likerDisplayName;
    }

    public String getLikedDisplayName() {
        return likedDisplayName;
    }

    public void setLikedDisplayName(String likedDisplayName) {
        this.likedDisplayName = likedDisplayName;
    }

    public boolean isLike() {
        return like;
    }

    public void setLike(boolean like) {
        this.like = like;
    }

    public UserProfileDTO getUserProfile() {
        return userProfile;
    }

    public void setUserProfile(UserProfileDTO userProfile) {
        this.userProfile = userProfile;
    }

    public UserBioDTO getUserBio() {
        return userBio;
    }

    public void setUserBio(UserBioDTO userBio) {
        this.userBio = userBio;
    }
} 
