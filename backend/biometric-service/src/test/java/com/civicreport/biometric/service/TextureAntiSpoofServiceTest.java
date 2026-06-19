package com.civicreport.biometric.service;

import org.junit.jupiter.api.Test;
import org.opencv.core.CvType;
import org.opencv.core.Mat;
import org.opencv.core.Scalar;
import org.opencv.imgproc.Imgproc;

import com.civicreport.biometric.config.BiometricProperties;

import static org.junit.jupiter.api.Assertions.assertTrue;

class TextureAntiSpoofServiceTest {

    static {
        nu.pattern.OpenCV.loadLocally();
    }

    @Test
    void sharpImageHasHigherLaplacianVarianceThanBlurred() {
        BiometricProperties props = new BiometricProperties();
        TextureAntiSpoofService service = new TextureAntiSpoofService(props);

        Mat sharp = new Mat(200, 200, CvType.CV_8UC3, new Scalar(128, 128, 128));
        Mat noise = new Mat(200, 200, CvType.CV_8UC3);
        org.opencv.core.Core.randu(noise, 0, 255);
        org.opencv.core.Core.add(sharp, noise, sharp);
        noise.release();

        Mat blurred = new Mat();
        Imgproc.GaussianBlur(sharp, blurred, new org.opencv.core.Size(15, 15), 0);

        double sharpVar = service.computeLaplacianVariance(sharp);
        double blurVar = service.computeLaplacianVariance(blurred);

        sharp.release();
        blurred.release();

        assertTrue(sharpVar > blurVar, "La imagen nítida debe tener mayor varianza Laplaciana");
    }
}
