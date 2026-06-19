package com.civicreport.biometric.util;

import org.opencv.core.Mat;
import org.opencv.core.MatOfRect;
import org.opencv.core.Rect;
import org.opencv.core.Size;
import org.opencv.imgproc.Imgproc;
import org.opencv.objdetect.CascadeClassifier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

@Component
public class FaceDetectionService {

    private static final Logger log = LoggerFactory.getLogger(FaceDetectionService.class);

    private final ScrfdOnnxDetector scrfdDetector;
    private CascadeClassifier faceCascade;

    public FaceDetectionService(ScrfdOnnxDetector scrfdDetector) {
        this.scrfdDetector = scrfdDetector;
    }

    @PostConstruct
    public void init() throws Exception {
        String cascadeName = "haarcascade_frontalface_default.xml";
        try (InputStream is = getClass().getResourceAsStream("/" + cascadeName)) {
            if (is == null) {
                throw new IllegalStateException("Haar cascade no encontrado en classpath");
            }
            Path temp = Files.createTempFile("haarcascade_", ".xml");
            Files.copy(is, temp, StandardCopyOption.REPLACE_EXISTING);
            temp.toFile().deleteOnExit();
            faceCascade = new CascadeClassifier(temp.toString());
        }
        if (faceCascade.empty()) {
            throw new IllegalStateException("No se pudo cargar el clasificador Haar para rostros");
        }
        log.info("Motor de detección facial: {}", getEngineName());
    }

    public String getEngineName() {
        return scrfdDetector.isModelLoaded() ? scrfdDetector.getEngineName() : "haar-cascade";
    }

    public DetectedFace detectSelfieFaceDetailed(Mat bgr) {
        if (scrfdDetector.isModelLoaded()) {
            DetectedFace face = scrfdDetector.detectBest(bgr, ScrfdOnnxDetector.DetectionProfile.SELFIE);
            if (face != null) {
                return face;
            }
        }
        Rect rect = detectHaar(bgr, new Size(70, 70), 1.1, 4, false);
        return rect == null ? null : new DetectedFace(rect, null);
    }

    public Rect detectSelfieFace(Mat bgr) {
        DetectedFace face = detectSelfieFaceDetailed(bgr);
        return face == null ? null : face.bbox();
    }

    public DetectedFace detectCedulaPortraitFaceDetailed(Mat cedulaBgr) {
        if (scrfdDetector.isModelLoaded()) {
            int roiW = Math.max(60, (int) (cedulaBgr.cols() * 0.58));
            Rect roi = new Rect(0, 0, roiW, cedulaBgr.rows());
            DetectedFace face = scrfdDetector.detectBestInRoi(cedulaBgr, roi, ScrfdOnnxDetector.DetectionProfile.CEDULA);
            if (face != null) {
                return face;
            }
            face = scrfdDetector.detectBest(cedulaBgr, ScrfdOnnxDetector.DetectionProfile.CEDULA);
            if (face != null) {
                return face;
            }
        }

        int roiW = Math.max(60, (int) (cedulaBgr.cols() * 0.58));
        Mat leftRoi = new Mat(cedulaBgr, new Rect(0, 0, roiW, cedulaBgr.rows()));
        try {
            Rect inRoi = detectHaar(leftRoi, new Size(18, 18), 1.05, 6, true);
            if (inRoi != null) {
                return new DetectedFace(inRoi, null);
            }
        } finally {
            leftRoi.release();
        }
        Rect rect = detectHaar(cedulaBgr, new Size(25, 25), 1.08, 5, true);
        return rect == null ? null : new DetectedFace(rect, null);
    }

    public Rect detectCedulaPortraitFace(Mat cedulaBgr) {
        DetectedFace face = detectCedulaPortraitFaceDetailed(cedulaBgr);
        return face == null ? null : face.bbox();
    }

    public Rect detectLargestFace(Mat bgr) {
        if (scrfdDetector.isModelLoaded()) {
            DetectedFace face = scrfdDetector.detectBest(bgr, ScrfdOnnxDetector.DetectionProfile.SELFIE);
            if (face != null) {
                return face.bbox();
            }
        }
        return detectHaar(bgr, new Size(60, 60), 1.1, 3, false);
    }

    private Rect detectHaar(Mat bgr, Size minSize, double scaleFactor, int minNeighbors, boolean preferLeft) {
        Mat gray = new Mat();
        try {
            Imgproc.cvtColor(bgr, gray, Imgproc.COLOR_BGR2GRAY);
            Imgproc.equalizeHist(gray, gray);
            MatOfRect faces = new MatOfRect();
            faceCascade.detectMultiScale(gray, faces, scaleFactor, minNeighbors, 0, minSize, new Size());
            Rect[] arr = faces.toArray();
            if (arr.length == 0) {
                return null;
            }
            Rect best = arr[0];
            double bestScore = scoreHaarRect(best, bgr.cols(), bgr.rows(), preferLeft);
            for (int i = 1; i < arr.length; i++) {
                double s = scoreHaarRect(arr[i], bgr.cols(), bgr.rows(), preferLeft);
                if (s > bestScore) {
                    bestScore = s;
                    best = arr[i];
                }
            }
            return best;
        } finally {
            gray.release();
        }
    }

    private double scoreHaarRect(Rect r, int imgW, int imgH, boolean preferLeft) {
        double area = r.area() / (double) (imgW * imgH);
        double cx = r.x + r.width / 2.0;
        double cy = r.y + r.height / 2.0;
        double centerYScore = 1.0 - Math.abs(cy / imgH - 0.45) * 2;
        double leftScore = preferLeft ? 1.0 - (cx / imgW) : 1.0 - Math.abs(cx / imgW - 0.5) * 2;
        return area * 0.5 + centerYScore * 0.25 + leftScore * 0.25;
    }

    public Mat cropFace(Mat bgr, Rect face, double paddingRatio) {
        int padX = (int) (face.width * paddingRatio);
        int padY = (int) (face.height * paddingRatio);
        int x = Math.max(0, face.x - padX);
        int y = Math.max(0, face.y - padY);
        int w = Math.min(bgr.cols() - x, face.width + 2 * padX);
        int h = Math.min(bgr.rows() - y, face.height + 2 * padY);
        return new Mat(bgr, new Rect(x, y, w, h));
    }
}
