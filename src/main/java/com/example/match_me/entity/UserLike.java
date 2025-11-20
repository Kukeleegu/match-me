package com.example.match_me.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "user_likes", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"liker_id", "liked_id"})
})
public class UserLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "liker_id", nullable = false)
    private User liker;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "liked_id", nullable = false)
    private User liked;

    @Column(name = "is_like", nullable = false)
    private boolean like; // true = like, false = dislike

    /* ---------- constructors ---------- */

    public UserLike() {}

    public UserLike(User liker, User liked, boolean like) {
        this.liker = liker;
        this.liked = liked;
        this.like = like;
    }

    /* ---------- getters / setters ---------- */

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getLiker() {
        return liker;
    }

    public void setLiker(User liker) {
        this.liker = liker;
    }

    public User getLiked() {
        return liked;
    }

    public void setLiked(User liked) {
        this.liked = liked;
    }

    public boolean isLike() {
        return like;
    }

    public void setLike(boolean like) {
        this.like = like;
    }
} 