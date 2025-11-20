package com.example.match_me.repository;

import com.example.match_me.entity.User;
import com.example.match_me.entity.UserLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserLikeRepository extends JpaRepository<UserLike, Long> {

    // Check if a user has interacted with another user (like or dislike)
    Optional<UserLike> findByLikerAndLiked(User liker, User liked);

    // Check if any interaction exists between two users
    boolean existsByLikerAndLiked(User liker, User liked);

    // Get all users that a specific user has liked (likeEquals = true)
    List<UserLike> findByLikerAndLikeEquals(User liker, boolean like);

    // Get all users who have liked a specific user (likeEquals = true)
    List<UserLike> findByLikedAndLikeEquals(User liked, boolean like);

    // Get mutual likes (matches) - both users liked each other
    @Query("SELECT ul1 FROM UserLike ul1 " +
           "WHERE ul1.like = true " +
           "AND EXISTS (SELECT ul2 FROM UserLike ul2 " +
           "WHERE ul2.liker = ul1.liked AND ul2.liked = ul1.liker AND ul2.like = true)")
    List<UserLike> findMutualLikes();

    // Get mutual likes for a specific user
    @Query("SELECT ul1 FROM UserLike ul1 " +
           "WHERE ul1.liker = :user AND ul1.like = true " +
           "AND EXISTS (SELECT ul2 FROM UserLike ul2 " +
           "WHERE ul2.liker = ul1.liked AND ul2.liked = ul1.liker AND ul2.like = true)")
    List<UserLike> findMutualLikesByUser(@Param("user") User user);

    // Optimized version - Get mutual likes for a specific user by ID
    @Query("SELECT ul1 FROM UserLike ul1 " +
           "WHERE ul1.liker.id = :userId AND ul1.like = true " +
           "AND EXISTS (SELECT ul2 FROM UserLike ul2 " +
           "WHERE ul2.liker = ul1.liked AND ul2.liked = ul1.liker AND ul2.like = true)")
    List<UserLike> findMutualLikesByUserId(@Param("userId") Long userId);

    // Count likes given by a user
    long countByLikerAndLikeEquals(User liker, boolean like);

    // Count likes received by a user
    long countByLikedAndLikeEquals(User liked, boolean like);

    // Get all interactions (likes + dislikes) by a user
    List<UserLike> findByLiker(User liker);

    // Get all interactions (likes + dislikes) received by a user
    List<UserLike> findByLiked(User liked);

    // Optimized version - Get all interactions by user ID
    @Query("SELECT ul FROM UserLike ul WHERE ul.liker.id = :userId")
    List<UserLike> findByLikerId(@Param("userId") Long userId);

    // Get IDs of users that a specific user has interacted with (for filtering)
    @Query("SELECT ul.liked.id FROM UserLike ul WHERE ul.liker = :user")
    List<Long> findInteractedUserIdsByLiker(@Param("user") User user);

    // Optimized methods to work directly with user IDs (reduces entity fetching)
    @Query("SELECT ul FROM UserLike ul WHERE ul.liker.id = :userId AND ul.like = :like")
    List<UserLike> findByLikerIdAndLikeEquals(@Param("userId") Long userId, @Param("like") boolean like);

    @Query("SELECT ul FROM UserLike ul WHERE ul.liked.id = :userId AND ul.like = :like")  
    List<UserLike> findByLikedIdAndLikeEquals(@Param("userId") Long userId, @Param("like") boolean like);

    @Query("SELECT COUNT(ul) FROM UserLike ul WHERE ul.liker.id = :userId AND ul.like = :like")
    long countByLikerIdAndLikeEquals(@Param("userId") Long userId, @Param("like") boolean like);

    @Query("SELECT COUNT(ul) FROM UserLike ul WHERE ul.liked.id = :userId AND ul.like = :like")
    long countByLikedIdAndLikeEquals(@Param("userId") Long userId, @Param("like") boolean like);

    @Query("SELECT CASE WHEN COUNT(ul) > 0 THEN true ELSE false END FROM UserLike ul WHERE ul.liker.id = :likerId AND ul.liked.id = :likedId")
    boolean existsByLikerIdAndLikedId(@Param("likerId") Long likerId, @Param("likedId") Long likedId);

    @Query("SELECT ul FROM UserLike ul WHERE ul.liker.id = :likerId AND ul.liked.id = :likedId")
    Optional<UserLike> findByLikerIdAndLikedId(@Param("likerId") Long likerId, @Param("likedId") Long likedId);
}
 