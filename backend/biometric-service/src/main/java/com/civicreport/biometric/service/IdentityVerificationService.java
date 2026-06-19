package com.civicreport.biometric.service;

import com.civicreport.biometric.config.BiometricProperties;
import com.civicreport.biometric.dto.VerifyIdentityRequest;
import com.civicreport.biometric.dto.VerifyIdentityResponse;
import com.civicreport.biometric.util.FaceDetectionService;
import com.civicreport.biometric.util.ImageUtils;
import org.opencv.core.Mat;
import org.opencv.core.Rect;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

@Service
public class IdentityVerificationService {

    private final BiometricProperties properties;
    private final TextureAntiSpoofService textureService;
    private final OnnxAntiSpoofService onnxAntiSpoofService;
    private final FaceEmbeddingService faceEmbeddingService;
    private final FaceDetectionService faceDetectionService;

    public IdentityVerificationService(
            BiometricProperties properties,
            TextureAntiSpoofService textureService,
            OnnxAntiSpoofService onnxAntiSpoofService,
            FaceEmbeddingService faceEmbeddingService,
            FaceDetectionService faceDetectionService
    ) {
        this.properties = properties;
        this.textureService = textureService;
        this.onnxAntiSpoofService = onnxAntiSpoofService;
        this.faceEmbeddingService = faceEmbeddingService;
        this.faceDetectionService = faceDetectionService;
    }

    public VerifyIdentityResponse verify(VerifyIdentityRequest request) {
        Map<String, Object> checks = new LinkedHashMap<>();

        if (!request.isLivenessClient()) {
            return VerifyIdentityResponse.reject(
                    "Debes completar la prueba de vitalidad (parpadeo) antes de enviar la selfie.",
                    checks
            );
        }
            checks.put("livenessClient", true);
            checks.put("faceDetectorEngine", faceDetectionService.getEngineName());

        String selfieB64 = stripDataUrl(request.getSelfieBase64());
        String cedulaB64 = stripDataUrl(request.getCedulaFrenteBase64());

        if (Objects.equals(selfieB64, cedulaB64)) {
            checks.put("duplicateImage", true);
            return VerifyIdentityResponse.reject(
                    "La selfie no puede ser la misma imagen que la cédula.",
                    checks
            );
        }
        checks.put("duplicateImage", false);

        Mat selfie = null;
        Mat cedula = null;
        try {
            selfie = ImageUtils.decodeBase64ToMat(selfieB64);
            cedula = ImageUtils.decodeBase64ToMat(cedulaB64);

            Map<String, Object> textureCheck = textureService.analyze(selfie);
            checks.put("texture", textureCheck);
            if (!(boolean) textureCheck.get("passes") && !properties.isDemoMode()) {
                return VerifyIdentityResponse.reject(
                        "SUPLANTACION_DETECTADA: textura sospechosa (imagen borrosa, suavizada o captura de pantalla).",
                        checks
                );
            }

            Map<String, Object> spoofCheck = onnxAntiSpoofService.analyze(selfie, textureService);
            checks.put("onnxSpoof", spoofCheck);
            if (!(boolean) spoofCheck.get("passes") && !properties.isDemoMode()) {
                return VerifyIdentityResponse.reject(
                        "SUPLANTACION_DETECTADA: anti-spoofing fallido, rostro no verificado como real.",
                        checks
                );
            }

            Rect cedulaFace = faceDetectionService.detectCedulaPortraitFace(cedula);
            if (cedulaFace == null) {
                checks.put("cedulaFaceDetected", false);
                return VerifyIdentityResponse.reject(
                        "No se detectó rostro en la foto frontal de la cédula.",
                        checks
                );
            }
            checks.put("cedulaFaceDetected", true);

            FaceEmbeddingService.FaceMatchResult match = faceEmbeddingService.compareFaces(selfie, cedula);
            checks.put("faceMatchScore", round(match.score()));
            checks.put("faceMatchThreshold", match.threshold());
            checks.put("faceMatchEngine", match.engine());
            checks.put("selfieFacePx", match.selfieFacePx());
            checks.put("cedulaFacePx", match.cedulaFacePx());

            if (!match.passes()) {
                return VerifyIdentityResponse.reject(
                        String.format(
                                "No se pudo confirmar que la selfie coincide con la cédula (%.1f%%, umbral %.0f%%). Intenta con mejor luz y enfoque.",
                                match.score() * 100, match.threshold() * 100
                        ),
                        checks
                );
            }

            String motivo = String.format(
                    "Identidad verificada. Coincidencia facial: %.1f%% (%s).",
                    match.score() * 100, match.engine()
            );
            return VerifyIdentityResponse.accept(match.score(), motivo, checks);
        } catch (Exception e) {
            checks.put("error", e.getMessage());
            return VerifyIdentityResponse.reject("Error al procesar imágenes: " + e.getMessage(), checks);
        } finally {
            ImageUtils.release(selfie, cedula);
        }
    }

    private static String stripDataUrl(String base64) {
        if (base64 == null) {
            return "";
        }
        if (base64.contains(",")) {
            return base64.substring(base64.indexOf(',') + 1);
        }
        return base64;
    }

    private static double round(double v) {
        return Math.round(v * 1000.0) / 1000.0;
    }
}
