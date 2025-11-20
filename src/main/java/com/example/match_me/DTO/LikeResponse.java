package com.example.match_me.DTO;

public class LikeResponse {
    private boolean success;
    private String message;
    private boolean isMatch;
    private Long likedUserId;

    public LikeResponse() {}

    public LikeResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }

    public LikeResponse(boolean success, String message, boolean isMatch, Long likedUserId) {
        this.success = success;
        this.message = message;
        this.isMatch = isMatch;
        this.likedUserId = likedUserId;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isMatch() {
        return isMatch;
    }

    public void setMatch(boolean match) {
        isMatch = match;
    }

    public Long getLikedUserId() {
        return likedUserId;
    }

    public void setLikedUserId(Long likedUserId) {
        this.likedUserId = likedUserId;
    }
} 