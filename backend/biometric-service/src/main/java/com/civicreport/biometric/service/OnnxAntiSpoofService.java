package com.civicreport.biometric.service;

import ai.onnxruntime.OnnxTensor;
import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtException;
import ai.onnxruntime.OrtSession;
import com.civicreport.biometric.config.BiometricProperties;
import com.civicreport.biometric.config.OrtSessionFactory;
import com.civicreport.biometric.util.FaceDetectionService;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.opencv.core.Mat;
import org.opencv.core.Rect;
import org.opencv.core.Size;
import org.opencv.imgproc.Imgproc;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.nio.FloatBuffer;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class OnnxAntiSpoofService {

    private static final Logger log = LoggerFactory.getLogger(OnnxAntiSpoofService.class);
    private static final int INPUT_SIZE = 80;
    private static final double CROP_SCALE = 2.7;
    private static final int LIVE_CLASS_INDEX = 0;

    private final BiometricProperties properties;
    private final ResourceLoader resourceLoader;
    private final FaceDetectionService faceDetectionService;
    private final OrtSessionFactory sessionFactory;

    private OrtEnvironment env;
    private OrtSession session;
    private boolean modelLoaded;

    public OnnxAntiSpoofService(
            BiometricProperties properties,
            ResourceLoader resourceLoader,
            FaceDetectionService faceDetectionService,
            OrtSessionFactory sessionFactory
    ) {
        this.properties = properties;
        this.resourceLoader = resourceLoader;
        this.faceDetectionService = faceDetectionService;
        this.sessionFactory = sessionFactory;
    }

    @PostConstruct
    public void init() {
        env = OrtEnvironment.getEnvironment();
        try {
            Resource resource = resourceLoader.getResource(properties.getModels().getAntiSpoof());
            if (!resource.exists()) {
                log.warn("Modelo anti-spoof ONNX no encontrado en {}. Se usará heurística OpenCV.", properties.getModels().getAntiSpoof());
                return;
            }
            try (InputStream is = resource.getInputStream()) {
                session = sessionFactory.createSession(env, is.readAllBytes());
                modelLoaded = true;
                log.info("MiniFASNetV2 anti-spoof cargado (provider={})", sessionFactory.getActiveProvider());
            }
        } catch (Exception e) {
            log.warn("No se pudo cargar modelo anti-spoof ONNX: {}", e.getMessage());
        }
    }

    @PreDestroy
    public void destroy() throws OrtException {
        if (session != null) {
            session.close();
        }
    }

    public boolean isModelLoaded() {
        return modelLoaded;
    }

    public Map<String, Object> analyze(Mat bgr, TextureAntiSpoofService textureService) {
        Map<String, Object> result = new LinkedHashMap<>();
        Rect face = faceDetectionService.detectSelfieFace(bgr);
        if (face == null) {
            result.put("passes", false);
            result.put("realProbability", 0.0);
            result.put("reason", "No se detectó rostro en la selfie");
            return result;
        }

        Mat faceCrop = modelLoaded
                ? cropForMiniFas(bgr, face)
                : faceDetectionService.cropFace(bgr, face, 0.15);
        try {
            double realProbability;
            if (modelLoaded) {
                realProbability = runOnnxInference(faceCrop);
                result.put("engine", "onnx-minifas");
            } else {
                realProbability = heuristicLiveScore(faceCrop, textureService);
                result.put("engine", "opencv-heuristic");
            }
            boolean passes = realProbability >= properties.getThresholds().getOnnxSpoofMin();
            result.put("realProbability", round(realProbability));
            result.put("threshold", properties.getThresholds().getOnnxSpoofMin());
            result.put("passes", passes);
            return result;
        } catch (Exception e) {
            result.put("passes", false);
            result.put("realProbability", 0.0);
            result.put("reason", e.getMessage());
            return result;
        } finally {
            faceCrop.release();
        }
    }

    public boolean isLive(Mat bgr, TextureAntiSpoofService textureService) {
        return (boolean) analyze(bgr, textureService).get("passes");
    }

    private Mat cropForMiniFas(Mat bgr, Rect face) {
        int srcW = bgr.cols();
        int srcH = bgr.rows();
        double scale = Math.min(
                Math.min((srcH - 1.0) / face.height, (srcW - 1.0) / face.width),
                CROP_SCALE
        );
        int newW = (int) (face.width * scale);
        int newH = (int) (face.height * scale);
        double centerX = face.x + face.width / 2.0;
        double centerY = face.y + face.height / 2.0;
        int x1 = Math.max(0, (int) (centerX - newW / 2.0));
        int y1 = Math.max(0, (int) (centerY - newH / 2.0));
        int x2 = Math.min(srcW - 1, (int) (centerX + newW / 2.0));
        int y2 = Math.min(srcH - 1, (int) (centerY + newH / 2.0));
        Mat cropped = new Mat(bgr, new Rect(x1, y1, x2 - x1 + 1, y2 - y1 + 1));
        Mat resized = new Mat();
        Imgproc.resize(cropped, resized, new Size(INPUT_SIZE, INPUT_SIZE));
        cropped.release();
        return resized;
    }

    private double runOnnxInference(Mat faceBgr80) throws OrtException {
        float[] input = bgrMatToNchwFloat(faceBgr80, INPUT_SIZE, INPUT_SIZE);
        long[] shape = {1, 3, INPUT_SIZE, INPUT_SIZE};
        try (OnnxTensor tensor = OnnxTensor.createTensor(env, FloatBuffer.wrap(input), shape);
             OrtSession.Result output = session.run(Map.of(session.getInputNames().iterator().next(), tensor))) {
            return extractLiveProbability(output.get(0).getValue());
        }
    }

    private double heuristicLiveScore(Mat faceCrop, TextureAntiSpoofService textureService) {
        double variance = textureService.computeLaplacianVariance(faceCrop);
        double moire = textureService.computeMoireScore(faceCrop);
        double varianceScore = Math.min(1.0, variance / 250.0);
        double moirePenalty = Math.min(1.0, moire);
        return Math.max(0.0, Math.min(1.0, varianceScore * (1.0 - moirePenalty * 0.5)));
    }

    private static float[] bgrMatToNchwFloat(Mat bgr, int width, int height) {
        float[] data = new float[3 * width * height];
        int plane = width * height;
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                double[] px = bgr.get(y, x);
                int idx = y * width + x;
                data[idx] = (float) (px[0] / 255.0);
                data[plane + idx] = (float) (px[1] / 255.0);
                data[2 * plane + idx] = (float) (px[2] / 255.0);
            }
        }
        return data;
    }

    private double extractLiveProbability(Object value) {
        float[] logits = toLogits(value);
        float[] probs = softmax(logits);
        return probs[LIVE_CLASS_INDEX];
    }

    private static float[] toLogits(Object value) {
        if (value instanceof float[][] arr) {
            return arr[0];
        }
        if (value instanceof float[] arr) {
            return arr;
        }
        throw new IllegalStateException("Salida ONNX anti-spoof no soportada");
    }

    private static float[] softmax(float[] logits) {
        float max = Float.NEGATIVE_INFINITY;
        for (float v : logits) {
            max = Math.max(max, v);
        }
        float sum = 0;
        float[] exp = new float[logits.length];
        for (int i = 0; i < logits.length; i++) {
            exp[i] = (float) Math.exp(logits[i] - max);
            sum += exp[i];
        }
        for (int i = 0; i < exp.length; i++) {
            exp[i] /= sum;
        }
        return exp;
    }

    private static double round(double v) {
        return Math.round(v * 1000.0) / 1000.0;
    }
}
