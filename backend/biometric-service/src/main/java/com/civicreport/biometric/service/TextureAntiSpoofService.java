package com.civicreport.biometric.service;

import com.civicreport.biometric.config.BiometricProperties;
import org.opencv.core.Core;
import org.opencv.core.Mat;
import org.opencv.core.MatOfDouble;
import org.opencv.core.MatOfFloat;
import org.opencv.core.MatOfInt;
import org.opencv.core.Scalar;
import org.opencv.imgproc.Imgproc;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class TextureAntiSpoofService {

    private final BiometricProperties properties;

    public TextureAntiSpoofService(BiometricProperties properties) {
        this.properties = properties;
    }

    public Map<String, Object> analyze(Mat bgr) {
        Map<String, Object> result = new LinkedHashMap<>();
        double laplacianVariance = computeLaplacianVariance(bgr);
        double moireScore = computeMoireScore(bgr);

        boolean laplacianPass = laplacianVariance >= properties.getThresholds().getLaplacianVarianceMin();
        boolean moirePass = moireScore <= properties.getThresholds().getMoireScoreMax();
        boolean passes = laplacianPass && moirePass;

        result.put("laplacianVariance", round(laplacianVariance));
        result.put("laplacianThreshold", properties.getThresholds().getLaplacianVarianceMin());
        result.put("laplacianPass", laplacianPass);
        result.put("moireScore", round(moireScore));
        result.put("moireThreshold", properties.getThresholds().getMoireScoreMax());
        result.put("moirePass", moirePass);
        result.put("passes", passes);
        return result;
    }

    public boolean passes(Mat bgr) {
        return (boolean) analyze(bgr).get("passes");
    }

    /**
     * Varianza del Laplaciano: imágenes borrosas, suavizadas por IA o capturas de pantalla
     * suelen tener varianza baja.
     */
    public double computeLaplacianVariance(Mat bgr) {
        Mat gray = new Mat();
        Mat laplacian = new Mat();
        MatOfDouble mean = new MatOfDouble();
        MatOfDouble stddev = new MatOfDouble();
        try {
            Imgproc.cvtColor(bgr, gray, Imgproc.COLOR_BGR2GRAY);
            Imgproc.Laplacian(gray, laplacian, gray.depth());
            Core.meanStdDev(laplacian, mean, stddev);
            double std = stddev.toArray()[0];
            return std * std;
        } finally {
            gray.release();
            laplacian.release();
            mean.release();
            stddev.release();
        }
    }

    /**
     * Proxy de efecto Moiré: mide la energía en bandas altas del histograma de luminancia (LAB-L).
     * Fotos de pantalla suelen mostrar patrones repetitivos.
     */
    public double computeMoireScore(Mat bgr) {
        Mat lab = new Mat();
        List<Mat> channels = new ArrayList<>();
        try {
            Imgproc.cvtColor(bgr, lab, Imgproc.COLOR_BGR2Lab);
            Core.split(lab, channels);
            Mat lChannel = channels.get(0);

            int histSize = 256;
            Mat hist = new Mat();
            Imgproc.calcHist(
                    List.of(lChannel),
                    new MatOfInt(0),
                    new Mat(),
                    hist,
                    new MatOfInt(histSize),
                    new MatOfFloat(0, 256)
            );

            double total = Core.sumElems(hist).val[0];
            if (total <= 0) {
                hist.release();
                return 0.0;
            }

            double highBandEnergy = 0.0;
            for (int i = 180; i < histSize; i++) {
                highBandEnergy += hist.get(i, 0)[0];
            }
            double highFreqRatio = highBandEnergy / total;

            // Periodicidad: contar picos locales en el histograma
            int peaks = 0;
            for (int i = 2; i < histSize - 2; i++) {
                double v = hist.get(i, 0)[0];
                if (v > hist.get(i - 1, 0)[0] && v > hist.get(i + 1, 0)[0] && v > total * 0.005) {
                    peaks++;
                }
            }

            hist.release();
            return Math.min(1.0, highFreqRatio * 2.0 + peaks / 40.0);
        } finally {
            lab.release();
            for (Mat ch : channels) {
                ch.release();
            }
        }
    }

    private static double round(double v) {
        return Math.round(v * 1000.0) / 1000.0;
    }
}
