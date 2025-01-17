package com.ethereum.sajauth.DTO;

import com.ethereum.sajauth.entities.User;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserRequestTimeout {
    private User user;
    private LocalDateTime timeoutExpiration;
}
