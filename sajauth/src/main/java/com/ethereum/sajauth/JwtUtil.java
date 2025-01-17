package com.ethereum.sajauth;

import com.ethereum.sajauth.entities.User;
import com.ethereum.sajauth.enums.JwtTokenEnum;
import com.ethereum.sajauth.repositories.UserRepository;
import io.jsonwebtoken.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Date;

@Component
public class JwtUtil {
    private final UserRepository userRepository;
    @Value("${jwt.secret.key}")
    private String SECRET_KEY;

    private final SignatureAlgorithm sa = SignatureAlgorithm.HS256;
    private final int ACCESS_TOKEN_EXPIRATION = 15 * 60 * 1000; // 15 minutes
    private final int REFRESH_TOKEN_EXPIRATION = 7 * 24 * 60 * 60 * 1000; // 7 days

    public JwtUtil(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Base64.getDecoder().decode(SECRET_KEY);
        return new SecretKeySpec(keyBytes, sa.getJcaName());
    }

    public String generateToken(String email, int tokenType) {
        Date accessTokenExpiration = new Date(System.currentTimeMillis() + ACCESS_TOKEN_EXPIRATION);
        Date refreshTokenExpiration = new Date(System.currentTimeMillis() + REFRESH_TOKEN_EXPIRATION);

        Long userId = userRepository.findByEmail(email)
                .map(User::getId)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));


        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .claim("userId", userId)
                .setExpiration(JwtTokenEnum.ACCESS.getId() == tokenType ? accessTokenExpiration : refreshTokenExpiration)
                .signWith(getSigningKey(), sa)
                .compact();
    }

    public Claims extractClaims(String token) {
        JwtParser jwtParser = Jwts.parser()
                .verifyWith(getSigningKey())
                .build();

        return jwtParser.parseClaimsJws(token).getBody();
    }

    public boolean validateToken(String token, String email) throws JwtException {
        return email.equals(extractClaims(token).getSubject());
    }

    public String hashRefreshToken(String refreshToken) {
        try {
            return Jwts.builder()
                    .setSubject(refreshToken)
                    .signWith(getSigningKey(), sa)
                    .compact();
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors du hashing du refresh token", e);
        }
    }

    public boolean validateRefreshTokenHash(String originalRefreshToken, String hashedRefreshToken) {
        try {
            String computedHash = hashRefreshToken(originalRefreshToken);
            // Comparaison sécurisée pour éviter les timing attacks
            return MessageDigest.isEqual(
                    computedHash.getBytes(StandardCharsets.UTF_8),
                    hashedRefreshToken.getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            return false;
        }
    }
}