package com.ethereum.sajauth.services;

import com.ethereum.sajauth.JwtUtil;
import com.ethereum.sajauth.entities.Role;
import com.ethereum.sajauth.entities.User;
import com.ethereum.sajauth.repositories.RoleRepository;
import com.ethereum.sajauth.repositories.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordService passwordService;
    private final JwtUtil jwtUtil;

    public UserService(UserRepository userRepository, JwtUtil jwtUtil, RoleRepository roleRepository, PasswordService passwordService) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.roleRepository = roleRepository;
        this.passwordService = passwordService;
    }

    public User getUserFromToken(String token) {
        String email = jwtUtil.extractClaims(token).getSubject();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User fillUser(String email, String password) {
        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordService.encryptPassword(password));
        user.setEnabled(false);

        // Attribution du rôle USER par défaut
        Role userRole = roleRepository.findByName("USER")
                .orElseGet(() -> {
                    Role newRole = new Role();
                    newRole.setName("ROLE_USER");
                    return roleRepository.save(newRole);
                });
        user.setRole(userRole);

        return user;
    }

    public boolean limitLoginAttempts(User user) {
        int attempts = user.getLoginAttempts();

        if (attempts < 5) {
            user.setLoginAttempts(++attempts);
        } else {
            user.setLoginAttempts(0);
            userRepository.save(user);
            return true;
        }

        userRepository.save(user);

        return false;
    }

}
