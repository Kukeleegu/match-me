package com.example.match_me.DTO;

public class LikeRequest {
    private Long likedUserId;
    private boolean like; // true = like, false = dislike

    public LikeRequest() {}

    public LikeRequest(Long likedUserId, boolean like) {
        this.likedUserId = likedUserId;
        this.like = like;
    }

    public Long getLikedUserId() {
        return likedUserId;
    }

    public void setLikedUserId(Long likedUserId) {
        this.likedUserId = likedUserId;
    }

    public boolean isLike() {
        return like;
    }

    public void setLike(boolean like) {
        this.like = like;
    }
} 