package com.example.match_me.DTO;

public class RegisterRequest {
    private String email;
    private String password;

    // Default constructor is required by Jackson (the JSON library) to deserialize
    public RegisterRequest() {
    }

    // All-args constructor for convenience if you want to build the object yourself
    public RegisterRequest(String email, String password) {
        this.email = email;
        this.password = password;
    }

    // Getter for email
    public String getEmail() {
        return email;
    }

    // Setter for email
    public void setEmail(String email) {
        this.email = email;
    }

    // Getter for password
    public String getPassword() {
        return password;
    }

    // Setter for password
    public void setPassword(String password) {
        this.password = password;
    }

    @Override
    public String toString() {
        return "RegisterRequest{" +
                "email='" + email + '\'' +
                ", password='[PROTECTED]'" +
                '}';
    }
}
