package com.ethereum.sajauth.DTO;

import lombok.Data;

@Data
public class TokenResponse {
    private String accessToken;
    private String refreshToken;
}
