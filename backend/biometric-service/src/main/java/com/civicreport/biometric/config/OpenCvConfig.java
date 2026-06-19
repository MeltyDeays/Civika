package com.civicreport.biometric.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenCvConfig {

    private static final Logger log = LoggerFactory.getLogger(OpenCvConfig.class);

    @PostConstruct
    public void loadOpenCv() {
        nu.pattern.OpenCV.loadLocally();
        log.info("OpenCV loaded successfully (version {})", org.opencv.core.Core.VERSION);
    }
}
