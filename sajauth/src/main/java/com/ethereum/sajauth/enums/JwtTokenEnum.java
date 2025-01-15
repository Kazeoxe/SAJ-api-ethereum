package com.ethereum.sajauth.enums;

import lombok.Getter;

@Getter
public enum JwtTokenEnum {
    ACCESS(1),
    REFRESH(2);

    private final int id;

    JwtTokenEnum(int id) {
        this.id = id;
    }
}
