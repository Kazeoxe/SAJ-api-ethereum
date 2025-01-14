package com.ethereum.sajauth.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;

    @Column(nullable = false)
    private String password;

    @Column(unique = true, nullable = false)
    private String email;

    private int wallet;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean enabled = false;

    private String verificationToken;
    private LocalDateTime verificationTokenExpiry;

    @ManyToOne
    @JoinColumn(name = "role")
    private Role role;
}
