/**
 * Liveness por parpadeo (MediaPipe) con fallback rápido si el modelo tarda.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { createDownscaledCanvas, createFaceMeshInstance, preloadFaceMesh } from "./faceMeshLoader";

const LEFT_EYE = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE = [362, 385, 387, 263, 373, 380];
const EAR_CLOSED = 0.22;
const CLOSED_FRAMES = 1;
const FRAME_INTERVAL_MS = 80;
const FALLBACK_AFTER_MS = 6000;
const AUTO_CAPTURE_FACE_MS = 2500;

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function eyeAspectRatio(landmarks, indices) {
  const p1 = landmarks[indices[0]];
  const p2 = landmarks[indices[1]];
  const p3 = landmarks[indices[2]];
  const p4 = landmarks[indices[3]];
  const p5 = landmarks[indices[4]];
  const p6 = landmarks[indices[5]];
  const vertical = dist(p2, p6) + dist(p3, p5);
  const horizontal = 2 * dist(p1, p4);
  return horizontal === 0 ? 1 : vertical / horizontal;
}

export function useBlinkLiveness(videoRef, enabled) {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("Preparando cámara...");
  const [blinkComplete, setBlinkComplete] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);

  const blinkStateRef = useRef("waiting_open");
  const closedFramesRef = useRef(0);
  const faceSeenAtRef = useRef(null);
  const blinkCompleteRef = useRef(false);
  const processingRef = useRef(false);
  const intervalRef = useRef(null);
  const faceMeshRef = useRef(null);

  const completeLiveness = useCallback(() => {
    if (blinkCompleteRef.current) return;
    blinkCompleteRef.current = true;
    setBlinkComplete(true);
    setStatus("ready");
    setMessage("¡Listo! Capturando...");
  }, []);

  const reset = useCallback(() => {
    blinkStateRef.current = "waiting_open";
    closedFramesRef.current = 0;
    faceSeenAtRef.current = null;
    blinkCompleteRef.current = false;
    setBlinkComplete(false);
    setFallbackMode(false);
    setFaceDetected(false);
    setStatus("detecting");
    setMessage("Parpadea o pulsa capturar cuando estés listo");
  }, []);

  useEffect(() => {
    if (enabled) preloadFaceMesh().catch(() => {});
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !videoRef?.current) return undefined;

    let cancelled = false;
    blinkStateRef.current = "waiting_open";
    closedFramesRef.current = 0;
    faceSeenAtRef.current = null;
    blinkCompleteRef.current = false;
    setBlinkComplete(false);
    setFallbackMode(false);
    setFaceDetected(false);
    setStatus("loading");
    setMessage("Cargando detector facial...");

    const fallbackTimer = setTimeout(() => {
      if (cancelled || blinkCompleteRef.current) return;
      setFallbackMode(true);
      setStatus("detecting");
      setMessage("Parpadea o pulsa «Capturar» cuando estés listo");
    }, FALLBACK_AFTER_MS);

    const startMesh = async () => {
      try {
        const faceMesh = await createFaceMeshInstance((results) => {
          if (cancelled || blinkCompleteRef.current) return;

          const landmarks = results.multiFaceLandmarks?.[0];
          if (!landmarks) {
            faceSeenAtRef.current = null;
            setFaceDetected(false);
            setStatus("no_face");
            setMessage("Centra tu rostro en el óvalo");
            return;
          }

          if (!faceSeenAtRef.current) faceSeenAtRef.current = Date.now();
          setFaceDetected(true);
          setStatus("detecting");

          const ear =
            (eyeAspectRatio(landmarks, LEFT_EYE) + eyeAspectRatio(landmarks, RIGHT_EYE)) / 2;
          const eyesClosed = ear < EAR_CLOSED;

          if (blinkStateRef.current === "waiting_open") {
            setMessage("Parpadea de forma natural");
            if (eyesClosed) {
              closedFramesRef.current += 1;
              if (closedFramesRef.current >= CLOSED_FRAMES) {
                blinkStateRef.current = "waiting_reopen";
                setMessage("Abre los ojos...");
              }
            }
          } else if (blinkStateRef.current === "waiting_reopen" && !eyesClosed) {
            completeLiveness();
          }

          if (
            faceSeenAtRef.current &&
            Date.now() - faceSeenAtRef.current >= AUTO_CAPTURE_FACE_MS &&
            blinkStateRef.current === "waiting_open"
          ) {
            setMessage("Rostro detectado — parpadea o captura");
          }
        });

        if (cancelled) {
          faceMesh.close();
          return;
        }

        faceMeshRef.current = faceMesh;
        setStatus("detecting");
        setMessage("Parpadea de forma natural");

        intervalRef.current = setInterval(async () => {
          if (cancelled || blinkCompleteRef.current || processingRef.current) return;
          const video = videoRef.current;
          if (!video || video.readyState < 2 || video.paused) return;

          processingRef.current = true;
          try {
            const canvas = createDownscaledCanvas(video, 320);
            await faceMesh.send({ image: canvas });
          } catch {
            /* frame skip */
          } finally {
            processingRef.current = false;
          }
        }, FRAME_INTERVAL_MS);
      } catch {
        if (!cancelled) {
          setFallbackMode(true);
          setStatus("detecting");
          setMessage("Modo rápido: pulsa «Capturar» con tu rostro centrado");
        }
      }
    };

    startMesh();

    return () => {
      cancelled = true;
      clearTimeout(fallbackTimer);
      if (intervalRef.current) clearInterval(intervalRef.current);
      faceMeshRef.current?.close();
      faceMeshRef.current = null;
    };
  }, [enabled, videoRef, completeLiveness]);

  const triggerManualCapture = useCallback(() => {
    completeLiveness();
  }, [completeLiveness]);

  return {
    status,
    message,
    blinkComplete,
    fallbackMode,
    faceDetected,
    reset,
    triggerManualCapture,
  };
}
