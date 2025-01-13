package com.ethereum.sajauth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.spec.SecretKeySpec;
import java.util.Date;

@Component
public class JwtUtil {
    @Value("${jwt.secret.key}")
    private String SECRET_KEY;

    private final SignatureAlgorithm sa = SignatureAlgorithm.HS256;

    public String generateToken(String email) {
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 10))
                .signWith(sa, SECRET_KEY)
                .compact();
    }

    public Claims extractClaims(String token) {
        SecretKeySpec secretKeySpec = new SecretKeySpec(SECRET_KEY.getBytes(), sa.getJcaName());

        JwtParser jwtParser = Jwts.parser()
                .verifyWith(secretKeySpec)
                .build();

        return jwtParser.parseClaimsJws(token).getBody();
    }

    public boolean validateToken(String token, String email) {
        return email.equals(extractClaims(token).getSubject());
    }
}
