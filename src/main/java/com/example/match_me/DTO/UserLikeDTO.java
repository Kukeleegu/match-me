package com.example.match_me.DTO;

public class UserLikeDTO {
    private Long id;
    private Long likerId;
    private Long likedId;
    private String likerDisplayName;
    private String likedDisplayName;
    private String likerEmail;
    private String likedEmail;
    private boolean like; // true = like, false = dislike

    /* ---------- constructors ---------- */

    public UserLikeDTO() {}

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

    public String getLikerEmail() {
        return likerEmail;
    }

    public void setLikerEmail(String likerEmail) {
        this.likerEmail = likerEmail;
    }

    public String getLikedEmail() {
        return likedEmail;
    }

    public void setLikedEmail(String likedEmail) {
        this.likedEmail = likedEmail;
    }

    public boolean isLike() {
        return like;
    }

    public void setLike(boolean like) {
        this.like = like;
    }
} 