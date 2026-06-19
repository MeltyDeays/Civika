package com.civicreport.biometric.util;

import org.opencv.core.Mat;
import org.opencv.core.MatOfByte;
import org.opencv.imgcodecs.Imgcodecs;

import java.util.Base64;

public final class ImageUtils {

    private ImageUtils() {
    }

    public static Mat decodeBase64ToMat(String base64) {
        if (base64 == null || base64.isBlank()) {
            throw new IllegalArgumentException("Imagen Base64 vacía");
        }
        String payload = base64;
        if (payload.contains(",")) {
            payload = payload.substring(payload.indexOf(',') + 1);
        }
        byte[] bytes = Base64.getDecoder().decode(payload);
        Mat mat = Imgcodecs.imdecode(new MatOfByte(bytes), Imgcodecs.IMREAD_COLOR);
        if (mat.empty()) {
            mat.release();
            throw new IllegalArgumentException("No se pudo decodificar la imagen Base64");
        }
        return mat;
    }

    public static void release(Mat... mats) {
        if (mats == null) {
            return;
        }
        for (Mat mat : mats) {
            if (mat != null) {
                mat.release();
            }
        }
    }
}
