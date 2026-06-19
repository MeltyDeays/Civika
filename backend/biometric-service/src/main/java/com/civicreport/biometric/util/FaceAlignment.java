package com.civicreport.biometric.util;

import org.opencv.core.Mat;
import org.opencv.core.MatOfPoint2f;
import org.opencv.core.Point;
import org.opencv.core.Size;
import org.opencv.calib3d.Calib3d;
import org.opencv.imgproc.Imgproc;

public final class FaceAlignment {

  private static final float[][] REFERENCE_112 = {
      {38.2946f, 51.6963f},
      {73.5318f, 51.5014f},
      {56.0252f, 71.7366f},
      {41.5493f, 92.3655f},
      {70.7299f, 92.2041f}
  };

  private FaceAlignment() {}

  public static Mat align(Mat bgr, float[][] landmarks, int outputSize) {
    if (landmarks == null || landmarks.length != 5) {
      Mat resized = new Mat();
      Imgproc.resize(bgr, resized, new Size(outputSize, outputSize));
      return resized;
    }

    Point[] src = new Point[5];
    Point[] dst = new Point[5];
    for (int i = 0; i < 5; i++) {
      src[i] = new Point(landmarks[i][0], landmarks[i][1]);
      dst[i] = new Point(REFERENCE_112[i][0], REFERENCE_112[i][1]);
    }

    MatOfPoint2f srcPts = new MatOfPoint2f(src);
    MatOfPoint2f dstPts = new MatOfPoint2f(dst);
    Mat affine = Calib3d.estimateAffinePartial2D(srcPts, dstPts);
    srcPts.release();
    dstPts.release();

    if (affine == null || affine.empty()) {
      Mat resized = new Mat();
      Imgproc.resize(bgr, resized, new Size(outputSize, outputSize));
      return resized;
    }

    Mat aligned = new Mat();
    Imgproc.warpAffine(
        bgr,
        aligned,
        affine,
        new Size(outputSize, outputSize),
        Imgproc.INTER_LINEAR,
        org.opencv.core.Core.BORDER_CONSTANT,
        new org.opencv.core.Scalar(0, 0, 0)
    );
    affine.release();
    return aligned;
  }
}
