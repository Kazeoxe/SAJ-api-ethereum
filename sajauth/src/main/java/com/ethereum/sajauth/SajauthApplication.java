package com.ethereum.sajauth;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.util.StringUtils;

@SpringBootApplication
public class SajauthApplication {

	@Value("${jwt.secret.key}")
	private String secretKey;

	@Value("${spring.mail.password}")
	private String smtpPassword;

	public static void main(String[] args) {
		SpringApplication.run(SajauthApplication.class, args);
	}

	@PostConstruct
	public void validateRequiredProperties() {
		if (StringUtils.isEmpty(secretKey)) {
			throw new IllegalStateException("La propriété jwt.secret.key est requise pour démarrer l'application");
		} else if (StringUtils.isEmpty(smtpPassword)) {
			throw new IllegalStateException("La propriété spring.mail.password est requise pour démarrer l'application");
		}
	}
}
