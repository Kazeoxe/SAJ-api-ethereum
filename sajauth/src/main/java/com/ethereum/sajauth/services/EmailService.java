package com.ethereum.sajauth.services;

import com.ethereum.sajauth.entities.User;
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

    public EmailService(JavaMailSender emailSender) {
        this.emailSender = emailSender;
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
}
