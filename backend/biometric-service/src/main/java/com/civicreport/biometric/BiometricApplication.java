package com.civicreport.biometric;

import com.civicreport.biometric.config.BiometricProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(BiometricProperties.class)
public class BiometricApplication {

    public static void main(String[] args) {
        SpringApplication.run(BiometricApplication.class, args);
    }
}
