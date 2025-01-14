package com.ethereum.sajauth.services;

import com.ethereum.sajauth.entities.User;
import com.ethereum.sajauth.repositories.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class VerificationTokenService {

    @Value("${app.verification.token.expiration:24}")
    private int tokenExpirationHours;

    private final UserRepository userRepository;

    public VerificationTokenService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public String generateVerificationToken() {
        return UUID.randomUUID().toString();
    }

    public void createVerificationToken(User user) {
        String token = generateVerificationToken();
        user.setVerificationToken(token);
        user.setVerificationTokenExpiry(LocalDateTime.now().now().plusHours(tokenExpirationHours));
        userRepository.save(user);
    }

    public Optional<User> validateToken(String token) {
        User user = userRepository.findByVerificationToken(token)
            .orElse(null);

        if (user == null) {
            return Optional.empty();
        }

        if (LocalDateTime.now().isAfter(user.getVerificationTokenExpiry())) {
            return Optional.empty();
        }

        user.setEnabled(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiry(null);
        userRepository.save(user);

        return Optional.of(user);
    }
}
