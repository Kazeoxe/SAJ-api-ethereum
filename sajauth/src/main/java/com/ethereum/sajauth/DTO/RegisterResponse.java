package com.ethereum.sajauth.DTO;

import lombok.Data;

@Data
public class RegisterResponse {
    private String token;

    public RegisterResponse(String token) {
        this.token = token;
    }
}
