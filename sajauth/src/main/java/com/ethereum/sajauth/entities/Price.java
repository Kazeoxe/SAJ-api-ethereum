package com.ethereum.sajauth.entities;

import jakarta.persistence.*;

import java.util.Date;

@Entity
@Table(name = "prices")
public class Price {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String symbol;
    private String currency;
    private Double value;
    private Date date;
}
