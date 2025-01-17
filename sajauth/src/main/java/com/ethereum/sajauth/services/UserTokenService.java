package com.ethereum.sajauth.services;

import com.ethereum.sajauth.DTO.TokenResponse;
import com.ethereum.sajauth.JwtUtil;
import com.ethereum.sajauth.entities.User;
import com.ethereum.sajauth.entities.UserToken;
import com.ethereum.sajauth.enums.JwtTokenEnum;
import com.ethereum.sajauth.repositories.UserTokenRepository;
import com.ethereum.sajauth.utils.CookieUtils;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Optional;

@Service
public class UserTokenService {

    private final UserTokenRepository userTokenRepository;
    private final JwtUtil jwtUtil;

    public UserTokenService(UserTokenRepository userTokenRepository, JwtUtil jwtUtil) {
        this.userTokenRepository = userTokenRepository;
        this.jwtUtil = jwtUtil;
    }

    public void createAndSaveRefreshToken(String refreshToken, User user) {
        removeOldUserTokens(user);
        UserToken userToken = new UserToken();
        userToken.setUser(user);
        userToken.setCreationDate(jwtUtil.extractClaims(refreshToken).getIssuedAt());
        userToken.setExpirationDate(jwtUtil.extractClaims(refreshToken).getExpiration());

        String hashedRefreshToken = jwtUtil.hashRefreshToken(refreshToken);
        userToken.setRefreshToken(hashedRefreshToken);

        userTokenRepository.save(userToken);
    }

    public TokenResponse createUserTokens(User user, HttpServletResponse response) {
        String accessToken = jwtUtil.generateToken(user.getEmail(), JwtTokenEnum.ACCESS.getId());
        String refreshToken = jwtUtil.generateToken(user.getEmail(), JwtTokenEnum.REFRESH.getId());

        CookieUtils.addRefreshTokenCookie(response, refreshToken);
        createAndSaveRefreshToken(refreshToken, user);

        TokenResponse tokenResponse = new TokenResponse();
        tokenResponse.setAccessToken(accessToken);
        tokenResponse.setRefreshToken(refreshToken);

        return tokenResponse;
    }

    public void removeOldUserTokens(User user) {
        userTokenRepository.deleteByUser(user);
    }

    public boolean validateRefreshToken(String refreshToken, User user) {
        String hashedRefreshToken = jwtUtil.hashRefreshToken(refreshToken);
        Optional<UserToken> userToken = userTokenRepository.findByRefreshTokenAndUser(hashedRefreshToken, user);

        if (userToken.isPresent()) {
            if (userToken.get().getExpirationDate().before(new Date())) {
                userTokenRepository.delete(userToken.get());
                return false;
            }
            return true;
        }
        return false;
    }
}
