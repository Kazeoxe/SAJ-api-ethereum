package com.ethereum.sajauth.DTO;

import lombok.Data;

@Data
public class ResetPwdRequest {
    private String password;
    private String token;
}
