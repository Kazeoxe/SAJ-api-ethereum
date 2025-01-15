package com.ethereum.sajauth.repositories;

import com.ethereum.sajauth.entities.User;
import com.ethereum.sajauth.entities.UserToken;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;

import javax.swing.text.html.Option;
import java.util.Optional;

public interface UserTokenRepository extends JpaRepository<UserToken, Long> {
    @Transactional
    void deleteByUser(User user);
    Optional<UserToken> findByRefreshTokenAndUser(String refreshToken, User user);
}
