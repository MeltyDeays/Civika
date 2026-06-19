package com.civicreport.biometric.service;

import ai.onnxruntime.OnnxTensor;
import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtException;
import ai.onnxruntime.OrtSession;
import com.civicreport.biometric.config.BiometricProperties;
import com.civicreport.biometric.config.OrtSessionFactory;
import com.civicreport.biometric.util.DetectedFace;
import com.civicreport.biometric.util.FaceAlignment;
import com.civicreport.biometric.util.FaceDetectionService;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.opencv.core.Core;
import org.opencv.core.DMatch;
import org.opencv.core.Mat;
import org.opencv.core.MatOfDMatch;
import org.opencv.core.MatOfKeyPoint;
import org.opencv.core.Rect;
import org.opencv.core.Scalar;
import org.opencv.core.Size;
import org.opencv.features2d.BFMatcher;
import org.opencv.features2d.ORB;
import org.opencv.imgproc.CLAHE;
import org.opencv.imgproc.Imgproc;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.nio.FloatBuffer;
import java.util.List;
import java.util.Map;

@Service
public class FaceEmbeddingService {

    private static final Logger log = LoggerFactory.getLogger(FaceEmbeddingService.class);
    private static final int INPUT_SIZE = 112;
    private static final int FACE_SIZE = 160;
    private static final float ARCFACE_MEAN = 127.5f;
    private static final float ARCFACE_SCALE = 127.5f;

    private final BiometricProperties properties;
    private final ResourceLoader resourceLoader;
    private final FaceDetectionService faceDetectionService;
    private final OrtSessionFactory sessionFactory;

    private OrtEnvironment env;
    private OrtSession session;
    private boolean modelLoaded;

    public FaceEmbeddingService(
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
            Resource resource = resourceLoader.getResource(properties.getModels().getFaceEmbedding());
            if (!resource.exists()) {
                log.warn("Modelo ONNX no encontrado. Comparación facial con OpenCV ORB.");
                return;
            }
            try (InputStream is = resource.getInputStream()) {
                session = sessionFactory.createSession(env, is.readAllBytes());
                modelLoaded = true;
                log.info("ArcFace ResNet-50 ONNX cargado (provider={})", sessionFactory.getActiveProvider());
            }
        } catch (Exception e) {
            log.warn("No se pudo cargar ONNX: {}", e.getMessage());
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

    public double getMatchThreshold() {
        return modelLoaded
                ? properties.getThresholds().getFaceMatchMin()
                : properties.getThresholds().getHistogramFaceMatchMin();
    }

    public String getEngineName() {
        return modelLoaded ? "onnx-arcface-r50" : "opencv-orb";
    }

    public FaceMatchResult compareFaces(Mat selfieBgr, Mat cedulaBgr) {
        DetectedFace selfie = faceDetectionService.detectSelfieFaceDetailed(selfieBgr);
        DetectedFace cedula = faceDetectionService.detectCedulaPortraitFaceDetailed(cedulaBgr);

        if (selfie == null) {
            throw new IllegalArgumentException("No se detectó rostro en la selfie");
        }
        if (cedula == null) {
            throw new IllegalArgumentException("No se detectó el retrato en la cédula. Usa foto del frente con buena luz.");
        }

        Mat selfiePrepared = prepareFace(selfieBgr, selfie);
        Mat cedulaPrepared = prepareFace(cedulaBgr, cedula);

        try {
            double score = modelLoaded
                    ? cosineSimilarity(extractOnnx(selfiePrepared), extractOnnx(cedulaPrepared))
                    : openCvCompare(selfiePrepared, cedulaPrepared);

            return new FaceMatchResult(
                    score,
                    getMatchThreshold(),
                    getEngineName(),
                    selfie.bbox().width,
                    cedula.bbox().width
            );
        } finally {
            selfiePrepared.release();
            cedulaPrepared.release();
        }
    }

    private Mat prepareFace(Mat bgr, DetectedFace face) {
        if (face.hasLandmarks()) {
            return FaceAlignment.align(bgr, face.landmarks(), INPUT_SIZE);
        }
        Mat crop = faceDetectionService.cropFace(bgr, face.bbox(), 0.25);
        Mat resized = new Mat();
        Imgproc.resize(crop, resized, new Size(INPUT_SIZE, INPUT_SIZE), 0, 0, Imgproc.INTER_CUBIC);
        crop.release();
        return resized;
    }

    private double openCvCompare(Mat faceA, Mat faceB) {
        Mat normA = normalizeFace(faceA);
        Mat normB = normalizeFace(faceB);
        try {
            double orb = orbSimilarity(normA, normB);
            double pearson = pixelCorrelation(normA, normB);
            double hist = Math.max(0, histogramCorrelation(normA, normB));
            double best = Math.max(orb, Math.max(pearson, hist));
            double blended = orb * 0.45 + pearson * 0.35 + hist * 0.20;
            return clamp01(Math.max(best * 0.85, blended));
        } finally {
            normA.release();
            normB.release();
        }
    }

    private Mat normalizeFace(Mat faceCrop) {
        Mat resized = new Mat();
        Mat gray = new Mat();
        Mat enhanced = new Mat();
        try {
            Imgproc.resize(faceCrop, resized, new Size(FACE_SIZE, FACE_SIZE), 0, 0, Imgproc.INTER_AREA);
            Imgproc.cvtColor(resized, gray, Imgproc.COLOR_BGR2GRAY);
            CLAHE clahe = Imgproc.createCLAHE(3.0, new Size(8, 8));
            clahe.apply(gray, enhanced);
            return enhanced.clone();
        } finally {
            resized.release();
            gray.release();
            enhanced.release();
        }
    }

    private double orbSimilarity(Mat grayA, Mat grayB) {
        ORB orb = ORB.create(600, 1.2f, 8, 31, 0, 2, ORB.HARRIS_SCORE, 31, 15);
        MatOfKeyPoint kpA = new MatOfKeyPoint();
        MatOfKeyPoint kpB = new MatOfKeyPoint();
        Mat descA = new Mat();
        Mat descB = new Mat();
        try {
            orb.detectAndCompute(grayA, new Mat(), kpA, descA);
            orb.detectAndCompute(grayB, new Mat(), kpB, descB);
            if (descA.empty() || descB.empty()) {
                return 0;
            }
            BFMatcher matcher = BFMatcher.create(BFMatcher.BRUTEFORCE_HAMMING, true);
            MatOfDMatch matches = new MatOfDMatch();
            matcher.match(descA, descB, matches);
            List<DMatch> list = matches.toList();
            if (list.isEmpty()) {
                return 0;
            }
            int good = 0;
            for (DMatch m : list) {
                if (m.distance < 55) {
                    good++;
                }
            }
            int denom = Math.max(1, Math.min(kpA.toArray().length, kpB.toArray().length));
            return clamp01((double) good / denom);
        } finally {
            kpA.release();
            kpB.release();
            descA.release();
            descB.release();
        }
    }

    private double pixelCorrelation(Mat grayA, Mat grayB) {
        Mat a = new Mat();
        Mat b = new Mat();
        try {
            grayA.convertTo(a, org.opencv.core.CvType.CV_32F);
            grayB.convertTo(b, org.opencv.core.CvType.CV_32F);
            Scalar meanA = Core.mean(a);
            Scalar meanB = Core.mean(b);
            Mat da = new Mat();
            Mat db = new Mat();
            Core.subtract(a, meanA, da);
            Core.subtract(b, meanB, db);
            double num = Core.sumElems(da.mul(db)).val[0];
            double denA = Math.sqrt(Core.sumElems(da.mul(da)).val[0]);
            double denB = Math.sqrt(Core.sumElems(db.mul(db)).val[0]);
            da.release();
            db.release();
            if (denA == 0 || denB == 0) {
                return 0;
            }
            return clamp01(num / (denA * denB));
        } finally {
            a.release();
            b.release();
        }
    }

    private double histogramCorrelation(Mat grayA, Mat grayB) {
        Mat histA = new Mat();
        Mat histB = new Mat();
        try {
            Imgproc.calcHist(
                    List.of(grayA), new org.opencv.core.MatOfInt(0), new Mat(), histA,
                    new org.opencv.core.MatOfInt(32), new org.opencv.core.MatOfFloat(0, 256)
            );
            Imgproc.calcHist(
                    List.of(grayB), new org.opencv.core.MatOfInt(0), new Mat(), histB,
                    new org.opencv.core.MatOfInt(32), new org.opencv.core.MatOfFloat(0, 256)
            );
            Core.normalize(histA, histA, 0, 1, Core.NORM_MINMAX);
            Core.normalize(histB, histB, 0, 1, Core.NORM_MINMAX);
            return Imgproc.compareHist(histA, histB, Imgproc.HISTCMP_CORREL);
        } finally {
            histA.release();
            histB.release();
        }
    }

    private float[] extractOnnx(Mat faceCrop) {
        try {
            return runOnnxEmbedding(faceCrop);
        } catch (OrtException e) {
            throw new IllegalStateException("Error ONNX", e);
        }
    }

    private float[] runOnnxEmbedding(Mat faceBgr) throws OrtException {
        Mat rgb = new Mat();
        try {
            Imgproc.cvtColor(faceBgr, rgb, Imgproc.COLOR_BGR2RGB);
            float[] input = arcFaceMatToNchw(rgb, INPUT_SIZE, INPUT_SIZE);
            long[] shape = {1, 3, INPUT_SIZE, INPUT_SIZE};
            try (OnnxTensor tensor = OnnxTensor.createTensor(env, FloatBuffer.wrap(input), shape);
                 OrtSession.Result output = session.run(Map.of(session.getInputNames().iterator().next(), tensor))) {
                return toFloatArray(output.get(0).getValue());
            }
        } finally {
            rgb.release();
        }
    }

    public static double cosineSimilarity(float[] a, float[] b) {
        double dot = 0, normA = 0, normB = 0;
        for (int i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return normA == 0 || normB == 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    private static double clamp01(double v) {
        return Math.max(0, Math.min(1, v));
    }

    private static float[] arcFaceMatToNchw(Mat rgb, int w, int h) {
        float[] data = new float[3 * w * h];
        int plane = w * h;
        for (int y = 0; y < h; y++) {
            for (int x = 0; x < w; x++) {
                double[] px = rgb.get(y, x);
                int i = y * w + x;
                data[i] = (float) ((px[0] - ARCFACE_MEAN) / ARCFACE_SCALE);
                data[plane + i] = (float) ((px[1] - ARCFACE_MEAN) / ARCFACE_SCALE);
                data[2 * plane + i] = (float) ((px[2] - ARCFACE_MEAN) / ARCFACE_SCALE);
            }
        }
        return data;
    }

    private static float[] toFloatArray(Object value) {
        if (value instanceof float[][] arr) return arr[0];
        if (value instanceof float[] arr) return arr;
        throw new IllegalStateException("Salida ONNX no soportada");
    }

    public record FaceMatchResult(double score, double threshold, String engine, int selfieFacePx, int cedulaFacePx) {
        public boolean passes() {
            return score >= threshold;
        }
    }
}
