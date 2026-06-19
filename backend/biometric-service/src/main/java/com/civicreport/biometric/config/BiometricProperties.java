package com.civicreport.biometric.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "biometric")
public class BiometricProperties {

    private Cors cors = new Cors();
    private Thresholds thresholds = new Thresholds();
    private Models models = new Models();
    private Onnx onnx = new Onnx();
    private Detection detection = new Detection();
    private boolean demoMode = false;

    public Cors getCors() {
        return cors;
    }

    public void setCors(Cors cors) {
        this.cors = cors;
    }

    public Thresholds getThresholds() {
        return thresholds;
    }

    public void setThresholds(Thresholds thresholds) {
        this.thresholds = thresholds;
    }

    public Models getModels() {
        return models;
    }

    public void setModels(Models models) {
        this.models = models;
    }

    public boolean isDemoMode() {
        return demoMode;
    }

    public void setDemoMode(boolean demoMode) {
        this.demoMode = demoMode;
    }

    public Onnx getOnnx() {
        return onnx;
    }

    public void setOnnx(Onnx onnx) {
        this.onnx = onnx;
    }

    public Detection getDetection() {
        return detection;
    }

    public void setDetection(Detection detection) {
        this.detection = detection;
    }

    public static class Cors {
        private String allowedOrigins = "http://localhost:5173";

        public String getAllowedOrigins() {
            return allowedOrigins;
        }

        public void setAllowedOrigins(String allowedOrigins) {
            this.allowedOrigins = allowedOrigins;
        }
    }

    public static class Thresholds {
        private double laplacianVarianceMin = 100.0;
        private double moireScoreMax = 0.65;
        private double onnxSpoofMin = 0.85;
        private double faceMatchMin = 0.89;
        private double cedulaFaceMatchMin = 0.85;
        private double histogramFaceMatchMin = 0.12;

        public double getLaplacianVarianceMin() {
            return laplacianVarianceMin;
        }

        public void setLaplacianVarianceMin(double laplacianVarianceMin) {
            this.laplacianVarianceMin = laplacianVarianceMin;
        }

        public double getMoireScoreMax() {
            return moireScoreMax;
        }

        public void setMoireScoreMax(double moireScoreMax) {
            this.moireScoreMax = moireScoreMax;
        }

        public double getOnnxSpoofMin() {
            return onnxSpoofMin;
        }

        public void setOnnxSpoofMin(double onnxSpoofMin) {
            this.onnxSpoofMin = onnxSpoofMin;
        }

        public double getFaceMatchMin() {
            return faceMatchMin;
        }

        public void setFaceMatchMin(double faceMatchMin) {
            this.faceMatchMin = faceMatchMin;
        }

        public double getCedulaFaceMatchMin() {
            return cedulaFaceMatchMin;
        }

        public void setCedulaFaceMatchMin(double cedulaFaceMatchMin) {
            this.cedulaFaceMatchMin = cedulaFaceMatchMin;
        }

        public double getHistogramFaceMatchMin() {
            return histogramFaceMatchMin;
        }

        public void setHistogramFaceMatchMin(double histogramFaceMatchMin) {
            this.histogramFaceMatchMin = histogramFaceMatchMin;
        }
    }

    public static class Models {
        private String antiSpoof = "classpath:models/anti_spoof.onnx";
        private String faceEmbedding = "classpath:models/face_embedding.onnx";
        private String faceDetector = "classpath:models/face_detector.onnx";

        public String getAntiSpoof() {
            return antiSpoof;
        }

        public void setAntiSpoof(String antiSpoof) {
            this.antiSpoof = antiSpoof;
        }

        public String getFaceEmbedding() {
            return faceEmbedding;
        }

        public void setFaceEmbedding(String faceEmbedding) {
            this.faceEmbedding = faceEmbedding;
        }

        public String getFaceDetector() {
            return faceDetector;
        }

        public void setFaceDetector(String faceDetector) {
            this.faceDetector = faceDetector;
        }
    }

    public static class Onnx {
        private boolean useGpu = true;
        private int gpuDeviceId = 0;

        public boolean isUseGpu() {
            return useGpu;
        }

        public void setUseGpu(boolean useGpu) {
            this.useGpu = useGpu;
        }

        public int getGpuDeviceId() {
            return gpuDeviceId;
        }

        public void setGpuDeviceId(int gpuDeviceId) {
            this.gpuDeviceId = gpuDeviceId;
        }
    }

    public static class Detection {
        private float iouThresh = 0.4f;

        public float getIouThresh() {
            return iouThresh;
        }

        public void setIouThresh(float iouThresh) {
            this.iouThresh = iouThresh;
        }
    }
}
