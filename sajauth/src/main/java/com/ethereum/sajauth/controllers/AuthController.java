package com.ethereum.sajauth.controllers;

import com.ethereum.sajauth.DTO.*;
import com.ethereum.sajauth.JwtUtil;
import com.ethereum.sajauth.entities.User;
import com.ethereum.sajauth.entities.Role;
import com.ethereum.sajauth.repositories.UserRepository;
import com.ethereum.sajauth.repositories.RoleRepository;
import com.ethereum.sajauth.services.EmailService;
import com.ethereum.sajauth.services.VerificationTokenService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import lombok.Data;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.regex.Pattern;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final VerificationTokenService verificationTokenService;
    private final EmailService emailService;

    private static final String EMAIL_REGEX = "^[A-Za-z0-9+_.-]+@(.+)$";
    private static final Pattern EMAIL_PATTERN = Pattern.compile(EMAIL_REGEX);

    public AuthController(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil, VerificationTokenService verificationTokenService,
            EmailService emailService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.verificationTokenService = verificationTokenService;
        this.emailService = emailService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest registerRequest) {
        // Validation de l'email
        if (!EMAIL_PATTERN.matcher(registerRequest.getEmail()).matches()) {
            return ResponseEntity.badRequest().body(new MessageResponse("Email invalide"));
        }

        // Vérification si l'email existe déjà
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Email déjà utilisé"));
        }

        // Validation du mot de passe (au moins 8 caractères)
        if (registerRequest.getPassword().length() < 8) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Le mot de passe doit contenir au moins 8 caractères"));
        }

        // Création du nouvel utilisateur
        User user = new User();
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setEnabled(false);

        // Attribution du rôle USER par défaut
        Role userRole = roleRepository.findByName("USER")
                .orElseGet(() -> {
                    Role newRole = new Role();
                    newRole.setName("ROLE_USER");
                    return roleRepository.save(newRole);
                });
        user.setRole(userRole);

        verificationTokenService.createVerificationToken(user);

        try {
            emailService.sendVerificationEmail(user, user.getVerificationToken());
            userRepository.save(user);
        } catch (Exception e) {
            // Log l'erreur et retourner un message approprié
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new MessageResponse("Erreur lors de l'envoi de l'email de confirmation"));
        }

        return ResponseEntity.ok(new MessageResponse("Un email de confirmation vous a été envoyé"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            User user = userRepository.findByEmail(loginRequest.getEmail())
                    .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé"));

            if (!user.isEnabled()) {
                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(new MessageResponse("Veuillez confirmer votre email avant de vous connecter"));
            }

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getEmail(),
                            loginRequest.getPassword()
                    )
            );

            String jwt = jwtUtil.generateToken(user.getUsername());

            return ResponseEntity.ok(new LoginResponse(jwt));

        } catch (UsernameNotFoundException | BadCredentialsException e) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("Email ou mot de passe incorrect"));
        }
    }

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyAccount(@RequestParam String token) {
        return verificationTokenService.validateToken(token)
                .map(user -> ResponseEntity.ok(new MessageResponse("Compte activé avec succès")))
                .orElse(ResponseEntity.badRequest().body(new MessageResponse("Token invalide ou expiré")));
    }

    @GetMapping("/validate-token")
    public ResponseEntity<?> validateToken() {
        return ResponseEntity.ok().build();
    }
}



