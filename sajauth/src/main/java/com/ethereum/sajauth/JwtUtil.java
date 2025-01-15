package com.ethereum.sajauth;

import com.ethereum.sajauth.entities.User;
import com.ethereum.sajauth.enums.JwtTokenEnum;
import io.jsonwebtoken.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;
import java.util.Date;

@Component
public class JwtUtil {
    @Value("${jwt.secret.key}")
    private String SECRET_KEY;

    private final SignatureAlgorithm sa = SignatureAlgorithm.HS256;
    private final int ACCESS_TOKEN_EXPIRATION = 60 * 1000; // 15 minutes
    private final int REFRESH_TOKEN_EXPIRATION = 7 * 24 * 60 * 60 * 1000; // 7 days

    private SecretKey getSigningKey() {
        byte[] keyBytes = Base64.getDecoder().decode(SECRET_KEY);
        return new SecretKeySpec(keyBytes, sa.getJcaName());
    }

    public String generateToken(String email, int tokenType) {
        Date accessTokenExpiration = new Date(System.currentTimeMillis() + ACCESS_TOKEN_EXPIRATION);
        Date refreshTokenExpiration = new Date(System.currentTimeMillis() + REFRESH_TOKEN_EXPIRATION);

        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
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

    public User getUserFromToken(String token) {
        Claims claims = extractClaims(token);
        User user = new User();
        user.setEmail(claims.getSubject());
        return user;
    }
}
