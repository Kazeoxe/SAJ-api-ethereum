package com.ethereum.sajauth.DTO;

import lombok.Data;

@Data
public class RegisterRequest {
    private String email;
    private String password;
}
