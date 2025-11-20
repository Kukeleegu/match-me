package com.example.match_me.DTO;

public class JwtResponse {
    private String token;

    public JwtResponse(String token) {
         this.token = token; 
    }

    // getter
    public String getToken() { return token; }
    // setter
    public void setToken(String token) { this.token = token; }

    // toString method
    @Override
    public String toString() {
        return "JwtResponse [token=" + token + "]";
    }
}
