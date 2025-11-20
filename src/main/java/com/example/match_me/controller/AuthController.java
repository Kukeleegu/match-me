package com.example.match_me.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.match_me.DTO.JwtResponse;
import com.example.match_me.DTO.LoginRequest;
import com.example.match_me.DTO.RegisterRequest;
import com.example.match_me.entity.User;
import com.example.match_me.repository.UserRepository;
import com.example.match_me.security.JwtUtil;
import com.example.match_me.service.AuthService;

@RestController //@RestController tells Spring:"This class handles HTTP requests and returns data (not HTML pages)."
@RequestMapping("/api/auth") //sets a base URL for all endpoints in this controller. So anything defined in this class will be under /api.
public class AuthController {

    private final AuthService authService;
    private final AuthenticationManager authenticationManager;  
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;    

    public AuthController(AuthService authService, AuthenticationManager authenticationManager, JwtUtil jwtUtil, UserRepository userRepository      ) {
        this.authService = authService;
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    //If someone sends a POST request to /api/auth/login, run this method.
    //Spring automatically maps the JSON data from the request body to your LoginRequest DTO class.
    //authenticationManager.authenticate() will check if the email and password are correct from the database(it uses the MyUserDetailsService to load the user by email)
    //if the email and password are correct, it will return a User object
    //then it will generate a JWT token using the JwtUtil class
    //then it will return the JWT token in the response body
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            Authentication authenticated = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
            
            // This is a Spring Security user (not your own entity)
            UserDetails springUser = (UserDetails) authenticated.getPrincipal();
            String email = springUser.getUsername(); // same as request.getEmail()
            
            // Fetch your real user object from DB
            User user = userRepository.findByEmail(email);
            if (user == null) {
                return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("User not found");
            }
            
            String jwt = jwtUtil.generateToken(user.getEmail());
            return ResponseEntity.ok(new JwtResponse(jwt));
        } catch (AuthenticationException e) {
            return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body("Invalid email or password");
        }
    }
    

    //If someone sends a POST request to /api/register, run this method
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            authService.register(request.getEmail(), request.getPassword());
            
            // Fetch the newly created user to get their ID
            User user = userRepository.findByEmail(request.getEmail());
            if (user == null) {
                return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("User registration succeeded but user not found");
            }
            
            // Generate JWT token with user ID for automatic login
            String jwt = jwtUtil.generateToken(user.getEmail());
            return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(new JwtResponse(jwt));

        } catch (RuntimeException e) {
            return ResponseEntity
                .badRequest()
                .body(e.getMessage());
        }
    }
}
