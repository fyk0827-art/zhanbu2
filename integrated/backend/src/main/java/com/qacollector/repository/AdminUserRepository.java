package com.qacollector.repository;

import com.qacollector.entity.AdminUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AdminUserRepository extends JpaRepository<AdminUser, Long> {
    Optional<AdminUser> findByUsername(String username);

    Optional<AdminUser> findByUsernameAndIsActiveTrue(String username);
}
