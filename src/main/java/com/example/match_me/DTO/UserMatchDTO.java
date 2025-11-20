package com.example.match_me.DTO;

public class UserMatchDTO extends PublicUserDTO {
    private double matchScore;
    private String matchDetails; // Optional: to show what matched
    
    public UserMatchDTO(PublicUserDTO dto, double matchScore) {
        this.setId(dto.getId());
        this.setProfile(dto.getProfile());
        this.setBio(dto.getBio());
        this.matchScore = matchScore;
    }
    
    public double getMatchScore() {
        return matchScore;
    }
    
    public void setMatchScore(double matchScore) {
        this.matchScore = matchScore;
    }
    
    public String getMatchDetails() {
        return matchDetails;
    }
    
    public void setMatchDetails(String matchDetails) {
        this.matchDetails = matchDetails;
    }
} 