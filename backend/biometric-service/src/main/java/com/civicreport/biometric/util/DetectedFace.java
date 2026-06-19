package com.civicreport.biometric.util;

import org.opencv.core.Rect;

public record DetectedFace(Rect bbox, float[][] landmarks) {

    public boolean hasLandmarks() {
        return landmarks != null && landmarks.length == 5;
    }
}
