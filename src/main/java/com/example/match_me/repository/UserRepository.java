package com.example.match_me.repository;

import com.example.match_me.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    User findByEmail(String email);
    // you can add custom finders here, e.g.:
    // Optional<User> findByEmail(String email);
}
