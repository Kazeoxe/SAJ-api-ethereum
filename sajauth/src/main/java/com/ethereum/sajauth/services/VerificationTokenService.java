package com.ethereum.sajauth.services;

import com.ethereum.sajauth.entities.User;
import com.ethereum.sajauth.enums.MailTypeEnum;
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

    @Value("${app.mail.confirmation.expiration.hours:24}")
    private int mailConfirmationExpirationToken;

    @Value("${app.reset.pwd.expiration.minutes:10}")
    private int resetPwdExpirationToken;

    private final UserRepository userRepository;
    private final PasswordService passwordService;
    private final UserTokenService userTokenService;

    public VerificationTokenService(UserRepository userRepository, PasswordService passwordService, UserTokenService userTokenService) {
        this.userRepository = userRepository;
        this.passwordService = passwordService;
        this.userTokenService = userTokenService;
    }

    public String generateVerificationToken() {
        return UUID.randomUUID().toString();
    }

    public void createVerificationToken(User user, String verificationType) {
        String token = generateVerificationToken();
        user.setVerificationToken(token);

        if (MailTypeEnum.MAIL_CONFIRMATION.getMailType().equals(verificationType))
            user.setVerificationTokenExpiry(LocalDateTime.now().now().plusHours(mailConfirmationExpirationToken));
        else if (MailTypeEnum.RESET_PWD.getMailType().equals(verificationType))
            user.setVerificationTokenExpiry(LocalDateTime.now().now().plusMinutes(resetPwdExpirationToken));
    }

    public Optional<User> validateEmailByToken(String token) {
        User user = userRepository.findByVerificationToken(token)
            .orElse(null);

        if (user == null)
            return Optional.empty();

        if (LocalDateTime.now().isAfter(user.getVerificationTokenExpiry()))
            return Optional.empty();

        user.setEnabled(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiry(null);
        userRepository.save(user);

        return Optional.of(user);
    }

    public Optional<User> resetPasswordByToken(String token, String password) {
        User user = userRepository.findByVerificationToken(token)
                .orElse(null);

        if (user == null)
            return Optional.empty();

        if (LocalDateTime.now().isAfter(user.getVerificationTokenExpiry()))
            return Optional.empty();

        user.setVerificationToken(null);
        user.setVerificationTokenExpiry(null);
        user.setPassword(passwordService.encryptPassword(password));

        // Suppression des refresh tokens de l'utilisateur
        userTokenService.removeOldUserTokens(user);

        userRepository.save(user);

        return Optional.of(user);
    }
}
