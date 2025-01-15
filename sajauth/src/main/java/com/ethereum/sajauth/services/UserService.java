package com.ethereum.sajauth.services;

import com.ethereum.sajauth.JwtUtil;
import com.ethereum.sajauth.entities.User;
import com.ethereum.sajauth.repositories.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public UserService(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    public User getUserFromToken(String token) {
        String email = jwtUtil.extractClaims(token).getSubject();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

}
