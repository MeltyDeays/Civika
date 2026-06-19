package com.civicreport.biometric.util;

import ai.onnxruntime.OnnxTensor;
import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtException;
import ai.onnxruntime.OrtSession;
import com.civicreport.biometric.config.BiometricProperties;
import com.civicreport.biometric.config.OrtSessionFactory;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.opencv.core.Mat;
import org.opencv.core.Rect;
import org.opencv.core.Scalar;
import org.opencv.core.Size;
import org.opencv.dnn.Dnn;
import org.opencv.imgproc.Imgproc;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.nio.FloatBuffer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class ScrfdOnnxDetector {

    private static final Logger log = LoggerFactory.getLogger(ScrfdOnnxDetector.class);
    private static final int INPUT_W = 640;
    private static final int INPUT_H = 640;
    private static final int FMC = 3;
    private static final int[] STRIDES = {8, 16, 32};
    private static final int NUM_ANCHORS = 2;
    private static final float MEAN = 127.5f;
    private static final float STD = 128.0f;

    private final BiometricProperties properties;
    private final ResourceLoader resourceLoader;
    private final OrtSessionFactory sessionFactory;

    private OrtEnvironment env;
    private OrtSession session;
    private String inputName;
    private List<String> outputNames;
    private boolean modelLoaded;

    public ScrfdOnnxDetector(
            BiometricProperties properties,
            ResourceLoader resourceLoader,
            OrtSessionFactory sessionFactory
    ) {
        this.properties = properties;
        this.resourceLoader = resourceLoader;
        this.sessionFactory = sessionFactory;
    }

    @PostConstruct
    public void init() {
        env = OrtEnvironment.getEnvironment();
        try {
            Resource resource = resourceLoader.getResource(properties.getModels().getFaceDetector());
            if (!resource.exists()) {
                log.warn("SCRFD no encontrado en {}. Se usará Haar cascade.", properties.getModels().getFaceDetector());
                return;
            }
            try (InputStream is = resource.getInputStream()) {
                session = sessionFactory.createSession(env, is.readAllBytes());
                inputName = session.getInputNames().iterator().next();
                outputNames = new ArrayList<>(session.getOutputNames());
                modelLoaded = true;
                log.info("SCRFD ONNX cargado ({} outputs, provider={})",
                        outputNames.size(), sessionFactory.getActiveProvider());
            }
        } catch (Exception e) {
            log.warn("No se pudo cargar SCRFD: {}", e.getMessage());
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

    public String getEngineName() {
        return modelLoaded ? "scrfd-10g" : "haar-cascade";
    }

    public DetectedFace detectBest(Mat bgr, DetectionProfile profile) {
        List<DetectedFace> faces = detectAll(bgr, profile.confidence());
        if (faces.isEmpty()) {
            return null;
        }
        return faces.stream()
                .max(Comparator.comparingDouble(f -> scoreFace(f.bbox(), bgr.cols(), bgr.rows(), profile)))
                .orElse(null);
    }

    public DetectedFace detectBestInRoi(Mat bgr, Rect roi, DetectionProfile profile) {
        Mat sub = new Mat(bgr, roi);
        try {
            DetectedFace face = detectBest(sub, profile);
            if (face == null) {
                return null;
            }
            Rect shifted = new Rect(
                    face.bbox().x + roi.x,
                    face.bbox().y + roi.y,
                    face.bbox().width,
                    face.bbox().height
            );
            float[][] shiftedLm = null;
            if (face.hasLandmarks()) {
                shiftedLm = new float[5][2];
                for (int i = 0; i < 5; i++) {
                    shiftedLm[i][0] = face.landmarks()[i][0] + roi.x;
                    shiftedLm[i][1] = face.landmarks()[i][1] + roi.y;
                }
            }
            return new DetectedFace(shifted, shiftedLm);
        } finally {
            sub.release();
        }
    }

    private List<DetectedFace> detectAll(Mat bgr, float confThresh) {
        int imgH = bgr.rows();
        int imgW = bgr.cols();
        double imRatio = (double) imgH / imgW;
        double modelRatio = (double) INPUT_H / INPUT_W;

        int newW;
        int newH;
        if (imRatio > modelRatio) {
            newH = INPUT_H;
            newW = (int) (newH / imRatio);
        } else {
            newW = INPUT_W;
            newH = (int) (newW * imRatio);
        }

        double detScale = (double) newH / imgH;
        Mat resized = new Mat();
        Mat detImage = new Mat(INPUT_H, INPUT_W, bgr.type(), new Scalar(0, 0, 0));
        try {
            Imgproc.resize(bgr, resized, new Size(newW, newH));
            Mat roi = detImage.submat(0, newH, 0, newW);
            resized.copyTo(roi);
            roi.release();

            float[] blob = preprocess(detImage);
            long[] shape = {1, 3, INPUT_H, INPUT_W};
            Map<String, OnnxTensor> inputs = new HashMap<>();
            try (OnnxTensor tensor = OnnxTensor.createTensor(env, FloatBuffer.wrap(blob), shape);
                 OrtSession.Result outputs = session.run(Map.of(inputName, tensor))) {

                List<float[]> scoresList = new ArrayList<>();
                List<float[][]> bboxesList = new ArrayList<>();
                List<float[][]> kpsList = new ArrayList<>();

                for (int idx = 0; idx < STRIDES.length; idx++) {
                    int stride = STRIDES[idx];
                    float[][] scores = to2d(outputs.get(idx).getValue());
                    float[][] bboxRaw = to2d(outputs.get(idx + FMC).getValue());
                    float[][] kpsRaw = to2d(outputs.get(idx + FMC * 2).getValue());

                    int height = INPUT_H / stride;
                    int width = INPUT_W / stride;
                    float[][] anchors = anchorCenters(height, width, stride);

                    for (int a = 0; a < anchors.length; a++) {
                        float score = scores[a][0];
                        if (score < confThresh) {
                            continue;
                        }
                        float[] dist = new float[4];
                        for (int j = 0; j < 4; j++) {
                            dist[j] = bboxRaw[a][j] * stride;
                        }
                        float[][] bbox = distance2bbox(anchors[a], dist);
                        scoresList.add(new float[]{score});
                        bboxesList.add(bbox);

                        float[] kpsDist = new float[10];
                        for (int j = 0; j < 10; j++) {
                            kpsDist[j] = kpsRaw[a][j] * stride;
                        }
                        kpsList.add(distance2kps(anchors[a], kpsDist));
                    }
                }

                if (scoresList.isEmpty()) {
                    return List.of();
                }

                List<Detection> dets = new ArrayList<>();
                for (int i = 0; i < scoresList.size(); i++) {
                    float[] box = bboxesList.get(i)[0];
                    float score = scoresList.get(i)[0];
                    float[][] kps = kpsList.get(i);
                    dets.add(new Detection(box, score, kps));
                }

                dets.sort((a, b) -> Float.compare(b.score, a.score));
                List<Detection> kept = nms(dets, properties.getDetection().getIouThresh());

                List<DetectedFace> result = new ArrayList<>();
                for (Detection det : kept) {
                    int x1 = clamp((int) (det.box[0] / detScale), 0, imgW - 1);
                    int y1 = clamp((int) (det.box[1] / detScale), 0, imgH - 1);
                    int x2 = clamp((int) (det.box[2] / detScale), 0, imgW - 1);
                    int y2 = clamp((int) (det.box[3] / detScale), 0, imgH - 1);
                    if (x2 <= x1 || y2 <= y1) {
                        continue;
                    }
                    Rect rect = new Rect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
                    float[][] lm = null;
                    if (det.kps != null && det.kps.length >= 5) {
                        lm = new float[5][2];
                        for (int k = 0; k < 5; k++) {
                            lm[k][0] = (float) (det.kps[k][0] / detScale);
                            lm[k][1] = (float) (det.kps[k][1] / detScale);
                        }
                    }
                    result.add(new DetectedFace(rect, lm));
                }
                return result;
            }
        } catch (Exception e) {
            log.debug("SCRFD inferencia falló: {}", e.getMessage());
            return List.of();
        } finally {
            resized.release();
            detImage.release();
        }
    }

    private float[] preprocess(Mat bgr) {
        Mat blob = Dnn.blobFromImage(
                bgr, 1.0 / STD, new Size(INPUT_W, INPUT_H),
                new Scalar(MEAN, MEAN, MEAN), true, false, org.opencv.core.CvType.CV_32F
        );
        try {
            float[] data = new float[(int) blob.total()];
            blob.get(0, 0, data);
            return data;
        } finally {
            blob.release();
        }
    }

    private static float[][] anchorCenters(int height, int width, int stride) {
        List<float[]> centers = new ArrayList<>();
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                float cx = x * stride;
                float cy = y * stride;
                for (int a = 0; a < NUM_ANCHORS; a++) {
                    centers.add(new float[]{cx, cy});
                }
            }
        }
        return centers.toArray(new float[0][]);
    }

    private static float[] scaleRow(float[][] raw, int anchorIdx, int stride) {
        float[] row = raw[anchorIdx];
        float[] scaled = new float[row.length];
        for (int i = 0; i < row.length; i++) {
            scaled[i] = row[i] * stride;
        }
        return scaled;
    }

    private static float[] scaleRowFlat(float[][] raw, int anchorIdx, int stride) {
        float[] row = raw[anchorIdx];
        float[] scaled = new float[row.length];
        for (int i = 0; i < row.length; i++) {
            scaled[i] = row[i] * stride;
        }
        return scaled;
    }

    private static float[][] distance2bbox(float[] point, float[] distance) {
        float x1 = point[0] - distance[0];
        float y1 = point[1] - distance[1];
        float x2 = point[0] + distance[2];
        float y2 = point[1] + distance[3];
        return new float[][]{{x1, y1, x2, y2}};
    }

    private static float[][] distance2kps(float[] point, float[] distance) {
        float[][] kps = new float[5][2];
        for (int i = 0; i < 5; i++) {
            kps[i][0] = point[0] + distance[i * 2];
            kps[i][1] = point[1] + distance[i * 2 + 1];
        }
        return kps;
    }

    private static List<Detection> nms(List<Detection> dets, float iouThresh) {
        List<Detection> kept = new ArrayList<>();
        boolean[] removed = new boolean[dets.size()];
        for (int i = 0; i < dets.size(); i++) {
            if (removed[i]) {
                continue;
            }
            kept.add(dets.get(i));
            for (int j = i + 1; j < dets.size(); j++) {
                if (!removed[j] && iou(dets.get(i).box, dets.get(j).box) > iouThresh) {
                    removed[j] = true;
                }
            }
        }
        return kept;
    }

    private static float iou(float[] a, float[] b) {
        float xx1 = Math.max(a[0], b[0]);
        float yy1 = Math.max(a[1], b[1]);
        float xx2 = Math.min(a[2], b[2]);
        float yy2 = Math.min(a[3], b[3]);
        float w = Math.max(0, xx2 - xx1 + 1);
        float h = Math.max(0, yy2 - yy1 + 1);
        float inter = w * h;
        float areaA = (a[2] - a[0] + 1) * (a[3] - a[1] + 1);
        float areaB = (b[2] - b[0] + 1) * (b[3] - b[1] + 1);
        return inter / (areaA + areaB - inter);
    }

    private static double scoreFace(Rect r, int imgW, int imgH, DetectionProfile profile) {
        double area = r.area() / (double) (imgW * imgH);
        double cx = r.x + r.width / 2.0;
        double cy = r.y + r.height / 2.0;
        double centerY = 1.0 - Math.abs(cy / imgH - profile.preferredCenterY()) * 2;
        double left = profile.preferLeft() ? 1.0 - (cx / imgW) : 1.0 - Math.abs(cx / imgW - 0.5) * 2;
        return area * 0.5 + centerY * 0.25 + left * 0.25;
    }

    private static int clamp(int v, int min, int max) {
        return Math.max(min, Math.min(max, v));
    }

    @SuppressWarnings("unchecked")
    private static float[][] to2d(Object value) {
        if (value instanceof float[][] arr) {
            return arr;
        }
        if (value instanceof float[] arr) {
            float[][] out = new float[arr.length][1];
            for (int i = 0; i < arr.length; i++) {
                out[i][0] = arr[i];
            }
            return out;
        }
        throw new IllegalStateException("Tensor SCRFD no soportado: " + value.getClass());
    }

    private record Detection(float[] box, float score, float[][] kps) {}

    public enum DetectionProfile {
        SELFIE(0.5f, 0.5, false),
        CEDULA(0.35f, 0.45, true);

        private final float confidence;
        private final double preferredCenterY;
        private final boolean preferLeft;

        DetectionProfile(float confidence, double preferredCenterY, boolean preferLeft) {
            this.confidence = confidence;
            this.preferredCenterY = preferredCenterY;
            this.preferLeft = preferLeft;
        }

        public float confidence() {
            return confidence;
        }

        public double preferredCenterY() {
            return preferredCenterY;
        }

        public boolean preferLeft() {
            return preferLeft;
        }
    }
}
