package com.civicreport.biometric.config;

import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtException;
import ai.onnxruntime.OrtSession;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class OrtSessionFactory {

    private static final Logger log = LoggerFactory.getLogger(OrtSessionFactory.class);

    private final BiometricProperties properties;
    private String activeProvider = "CPU";
    private boolean providerResolved;

    public OrtSessionFactory(BiometricProperties properties) {
        this.properties = properties;
    }

    @PostConstruct
    public void resolveProvider() {
        if (!properties.getOnnx().isUseGpu()) {
            activeProvider = "CPU";
            providerResolved = true;
            log.info("ONNX Runtime en CPU (biometric.onnx.use-gpu=false)");
            return;
        }

        try (OrtEnvironment env = OrtEnvironment.getEnvironment()) {
            OrtSession.SessionOptions options = new OrtSession.SessionOptions();
            if (tryCuda(options)) {
                activeProvider = "CUDA";
            } else {
                activeProvider = "CPU";
                log.warn("CUDA no disponible. Ejecuta backend/biometric-service/scripts/install-cuda-deps.ps1");
            }
        } catch (Exception e) {
            activeProvider = "CPU";
            log.warn("No se pudo resolver acelerador GPU: {}. Usando CPU.", e.getMessage());
        }
        providerResolved = true;
    }

    public OrtSession createSession(OrtEnvironment env, byte[] modelBytes) throws OrtException {
        OrtSession.SessionOptions options = new OrtSession.SessionOptions();
        options.setOptimizationLevel(OrtSession.SessionOptions.OptLevel.ALL_OPT);
        applyProvider(options);
        return env.createSession(modelBytes, options);
    }

    private void applyProvider(OrtSession.SessionOptions options) throws OrtException {
        if (!providerResolved) {
            resolveProvider();
        }
        if ("CUDA".equals(activeProvider)) {
            options.addCUDA(properties.getOnnx().getGpuDeviceId());
        }
    }

    private boolean tryCuda(OrtSession.SessionOptions options) {
        try {
            options.addCUDA(properties.getOnnx().getGpuDeviceId());
            log.info("ONNX Runtime usando CUDA (RTX 4060, dispositivo {})", properties.getOnnx().getGpuDeviceId());
            return true;
        } catch (OrtException e) {
            log.debug("CUDA no disponible: {}", e.getMessage());
            return false;
        }
    }

    public String getActiveProvider() {
        return activeProvider;
    }
}
