package com.ethereum.sajauth.controllers;

import com.ethereum.sajauth.DTO.*;
import com.ethereum.sajauth.JwtUtil;
import com.ethereum.sajauth.entities.User;
import com.ethereum.sajauth.entities.Role;
import com.ethereum.sajauth.repositories.UserRepository;
import com.ethereum.sajauth.repositories.RoleRepository;
import com.ethereum.sajauth.services.EmailService;
import com.ethereum.sajauth.services.UserService;
import com.ethereum.sajauth.services.UserTokenService;
import com.ethereum.sajauth.services.VerificationTokenService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/v1")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final VerificationTokenService verificationTokenService;
    private final EmailService emailService;
    private final UserTokenService userTokenService;
    private final UserService userService;

    private static final String EMAIL_REGEX = "^[A-Za-z0-9+_.-]+@(.+)$";
    private static final Pattern EMAIL_PATTERN = Pattern.compile(EMAIL_REGEX);
    private static final String PASSWORD_REGEX = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[\\W_]).{8,}$";
    private static final Pattern PASSWORD_PATTERN = Pattern.compile(PASSWORD_REGEX);
    private final JwtUtil jwtUtil;

    public AuthController(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            VerificationTokenService verificationTokenService,
            EmailService emailService, UserTokenService userTokenService,
            UserService userService, JwtUtil jwtUtil) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.verificationTokenService = verificationTokenService;
        this.emailService = emailService;
        this.userTokenService = userTokenService;
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/auth/register")
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
        if (!PASSWORD_PATTERN.matcher(registerRequest.getPassword()).matches()) {
            return ResponseEntity.badRequest()
                    .body(new MessageResponse("Le mot de passe doit contenir au moins 8 caractères, minuscule, majuscule, chiffre et caractère spécial"));
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

    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest, HttpServletResponse response) {
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

            TokenResponse userTokens = userTokenService.createUserTokens(user, response);

            return ResponseEntity.ok(new LoginResponse(userTokens.getAccessToken(), user.getId()));
        } catch (UsernameNotFoundException | BadCredentialsException e) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(new MessageResponse("Email ou mot de passe incorrect"));
        }
    }

    @PostMapping("/auth/verify-email")
    public ResponseEntity<?> verifyAccount(@RequestBody VerifyAccountRequest request) {
        return verificationTokenService.validateToken(request.getToken())
                .map(user -> ResponseEntity.ok(new MessageResponse("Compte activé avec succès")))
                .orElse(ResponseEntity.badRequest().body(new MessageResponse("Token invalide ou expiré")));
    }

    @GetMapping("/validate-token")
    public ResponseEntity<?> validateToken() {
        return ResponseEntity.ok().build();
    }

    @GetMapping("/auth/refresh-token")
    public ResponseEntity<?> refreshToken(@CookieValue("refreshToken") String refreshToken, HttpServletResponse response) {
        try {
            Claims claims = jwtUtil.extractClaims(refreshToken); // Vérifie la signature et l'expiration
            String email = claims.getSubject();
            User user = userService.getUserFromToken(refreshToken);

            if (email == null || !userTokenService.validateRefreshToken(refreshToken, user)) // Vérifie si le token est révoqué ou non
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new MessageResponse("Token invalide ou révoqué"));

            TokenResponse userTokens = userTokenService.createUserTokens(user, response);

            return ResponseEntity.ok(new LoginResponse(userTokens.getAccessToken(), user.getId()));

        } catch (ExpiredJwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new MessageResponse("Token expiré"));
        } catch (JwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new MessageResponse("Token invalide"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");

        // Vérification explicite du header même si le filtre JWT est présent
        if (authHeader == null || !authHeader.startsWith("Bearer "))
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new MessageResponse("Token d'authentification manquant"));

        try {
            String jwt = authHeader.substring(7);
            User user = userService.getUserFromToken(jwt);

            if (user == null)
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new MessageResponse("Utilisateur non trouvé"));

            userTokenService.removeOldUserTokens(user);
            return ResponseEntity.ok().body(new MessageResponse("Déconnexion réussie"));

        } catch (JwtException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new MessageResponse("Token invalide"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new MessageResponse("Erreur lors de la déconnexion"));
        }
    }

}



