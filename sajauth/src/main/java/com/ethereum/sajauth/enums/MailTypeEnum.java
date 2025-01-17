package com.ethereum.sajauth.enums;

import lombok.Getter;

@Getter
public enum MailTypeEnum {
    RESET_PWD("RESET_PWD"),
    MAIL_CONFIRMATION("MAIL_CONFIRMATION");

    private final String mailType;

    MailTypeEnum(String mailType) {
        this.mailType = mailType;
    }
}