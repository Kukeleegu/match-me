package com.example.match_me.DTO;

//this is a data transfer object
//this turns json data received from front end into java object (thanks to jackson which is added automatically with starter web)

public class LoginRequest {
    private String email;
    private String password;

    // All-args constructor for convenience if you want to build the object yourself
    public LoginRequest(String email, String password) {
        this.email = email;
        this.password = password;
    }

    // No-args constructor required for JSON deserialization
    public LoginRequest() {
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
        return "LoginRequest{" +
                "email='" + email + '\'' +
                ", password='[PROTECTED]'" +
                '}';
    }
}
