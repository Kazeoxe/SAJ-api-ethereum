package com.ethereum.sajauth.services;

import com.ethereum.sajauth.entities.User;
import com.ethereum.sajauth.enums.MailTypeEnum;
import com.ethereum.sajauth.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    private final JavaMailSender emailSender;
    private final VerificationTokenService verificationTokenService;
    private final UserRepository userRepository;

    public EmailService(JavaMailSender emailSender, VerificationTokenService verificationTokenService, UserRepository userRepository) {
        this.emailSender = emailSender;
        this.verificationTokenService = verificationTokenService;
        this.userRepository = userRepository;
    }

    public void sendEmail(User user, String mailType) throws MailException {
        verificationTokenService.createVerificationToken(user, mailType);

        if (MailTypeEnum.MAIL_CONFIRMATION.getMailType().equals(mailType))
            sendVerificationEmail(user, user.getVerificationToken());
        else if (MailTypeEnum.RESET_PWD.getMailType().equals(mailType))
            sendResetPasswordEmail(user, user.getVerificationToken());

        userRepository.save(user);
    }

    public void sendVerificationEmail(User user, String token) throws MailException {
        String verificationUrl = frontendUrl + "/verify-email/" + token;

        String emailContent = """
            <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #333;">Bienvenue sur notre plateforme !</h2>
                <p>Bonjour %s,</p>
                <p>Merci de vous être inscrit. Pour activer votre compte, veuillez cliquer sur le bouton ci-dessous :</p>
                <div style="margin: 30px 0;">
                    <a href="%s"
                       style="background-color: #4CAF50;
                              color: white;
                              padding: 12px 25px;
                              text-decoration: none;
                              border-radius: 4px;">
                        Confirmer mon compte
                    </a>
                </div>
                <p>Ce lien est valable pendant 24 heures.</p>
                <p>Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>
                <p>Cordialement,<br>L'équipe</p>
            </body>
            </html>
            """.formatted(user.getUsername(), verificationUrl);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(user.getEmail());
        message.setSubject("Confirmation de votre compte");
        message.setText(emailContent);

        emailSender.send(message);
    }

    public void sendResetPasswordEmail(User user, String token) throws MailException {
        String resetPasswordUrl = frontendUrl + "/reset-password/" + token;

        String emailContent = """
            <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #333;">Réinitialiser votre mot de passe</h2>
                <p>Bonjour %s,</p>
                <p>Pour réinitialiser votre mot de passe, veuillez cliquer sur le bouton ci-dessous :</p>
                <div style="margin: 30px 0;">
                    <a href="%s"
                       style="background-color: #4CAF50;
                              color: white;
                              padding: 12px 25px;
                              text-decoration: none;
                              border-radius: 4px;">
                        Réinitialiser votre mot de passe
                    </a>
                </div>
                <p>Ce lien est valable pendant 10 minutes</p>
                <p>Si vous n'avez pas déclaré vouloir changer de mot de passe, vous pouvez ignorer cet email.</p>
                <p>Cordialement,<br>L'équipe</p>
            </body>
            </html>
            """.formatted(user.getUsername(), resetPasswordUrl);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(user.getEmail());
        message.setSubject("Réinitialiser votre mot de passe");
        message.setText(emailContent);

        emailSender.send(message);
    }
}
