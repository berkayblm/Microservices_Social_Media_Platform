package com.micro_project.messagingservice.userservice.repository;

import com.micro_project.messagingservice.userservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    
    @Query(value = "SELECT * FROM users WHERE id NOT IN :excludeIds ORDER BY RAND() LIMIT :limit", nativeQuery = true)
    List<User> findRandomUsersExcludingIds(@Param("excludeIds") List<Long> excludeIds, @Param("limit") int limit);
    
    @Query(value = "SELECT * FROM users ORDER BY RAND() LIMIT :limit", nativeQuery = true)
    List<User> findRandomUsers(@Param("limit") int limit);
}
