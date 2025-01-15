package com.ethereum.sajauth.repositories;

import com.ethereum.sajauth.entities.User;
import com.ethereum.sajauth.entities.UserToken;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserTokenRepository extends JpaRepository<UserToken, Long> {
    @Transactional
    void deleteByUser(User user);
}
