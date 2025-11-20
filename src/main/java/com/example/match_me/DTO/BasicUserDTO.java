package com.example.match_me.DTO;

public class BasicUserDTO {
    private Long id;
    private String displayName;
    private String profileLink;

    public BasicUserDTO() {}

    public BasicUserDTO(Long id, String displayName, String profileLink) {
        this.id = id;
        this.displayName = displayName;
        this.profileLink = profileLink;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public String getProfileLink() { return profileLink; }
    public void setProfileLink(String profileLink) { this.profileLink = profileLink; }
}