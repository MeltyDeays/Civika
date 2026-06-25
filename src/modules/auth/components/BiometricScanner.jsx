import { useCallback, useEffect, useRef, useState } from "react";
import { useBlinkLiveness } from "./useBlinkLiveness";

const STEPS = [
  { key: "camera", label: "Cámara" },
  { key: "face", label: "Rostro" },
  { key: "blink", label: "Parpadeo" },
];

function stepIndex(status, captured, blinkComplete) {
  if (captured) return 3;
  if (blinkComplete) return 3;
  if (status === "no_face") return 1;
  if (status === "detecting" || status === "ready" || status === "loading") return 2;
  return 0;
}

/**
 * Escáner biométrico: cámara en vivo + liveness por parpadeo.
 */
export default function BiometricScanner({ onCapture, disabled = false, embedded = false, compact = false }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [captured, setCaptured] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  const { status, message, blinkComplete, fallbackMode, faceDetected, reset, triggerManualCapture } =
    useBlinkLiveness(videoRef, cameraReady && !captured && !disabled);

  const activeStep = stepIndex(status, captured, blinkComplete);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video) return null;

    const canvas = document.createElement("canvas");
    const maxDim = 800;
    let w = video.videoWidth;
    let h = video.videoHeight;
    if (w > h && w > maxDim) {
      h = Math.round((h * maxDim) / w);
      w = maxDim;
    } else if (h > maxDim) {
      w = Math.round((w * maxDim) / h);
      h = maxDim;
    }
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(video, 0, 0, w, h);

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          resolve({ blob, base64: dataUrl.split(",")[1], dataUrl });
        },
        "image/jpeg",
        0.85
      );
    });
  }, []);

  useEffect(() => {
    if (!blinkComplete || captured || disabled) return;
    let cancelled = false;
    (async () => {
      const frame = await captureFrame();
      if (!frame || cancelled) return;
      setCaptured(true);
      setPreviewUrl(frame.dataUrl);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      onCapture?.(frame.blob, frame.base64, frame.dataUrl);
    })();
    return () => { cancelled = true; };
  }, [blinkComplete, captured, disabled, captureFrame, onCapture]);

  useEffect(() => {
    if (disabled) return undefined;
    let active = true;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
          setCameraReady(true);
          setCameraError("");
        }
      } catch (err) {
        setCameraError(
          err?.message || "No se pudo acceder a la cámara. Concede permisos o usa HTTPS."
        );
      }
    })();

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [disabled]);

  const handleRetake = () => {
    setCaptured(false);
    setPreviewUrl("");
    reset();
    setCameraReady(false);
    setCameraError("");
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      .then((stream) => {
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.play();
          setCameraReady(true);
        }
      })
      .catch((err) => setCameraError(err.message));
  };

  const statusText = cameraError || message || {
    idle: "Preparando...",
    loading: "Cargando detector...",
    no_face: "Centra tu rostro en el óvalo",
    detecting: "Parpadea o captura",
    ready: "¡Captura exitosa!",
    error: "Error de detección",
  }[status] || "Preparando...";

  const showCaptureBtn =
    cameraReady && !captured && (fallbackMode || faceDetected) && !blinkComplete;

  const ovalPulse = (status === "detecting" || status === "loading") && !captured;

  return (
    <div className={`bio-scanner ${embedded ? "bio-scanner--embedded" : ""} ${compact ? "bio-scanner--compact" : ""}`}>
      <div className="bio-scanner__layout">
        <div className="bio-scanner__viewport">
          {!captured ? (
            <>
              {!cameraReady && !cameraError && (
                <div className="bio-scanner__loading">
                  <span className="bio-scanner__spinner" />
                  <span>Conectando cámara...</span>
                </div>
              )}
              <video
                ref={videoRef}
                className="bio-scanner__video"
                playsInline
                muted
                autoPlay
              />
              <div className="bio-scanner__mask" aria-hidden="true">
                <div className={`bio-scanner__oval ${ovalPulse ? "bio-scanner__oval--pulse" : ""} ${status === "no_face" ? "bio-scanner__oval--warn" : ""}`} />
                <div className="bio-scanner__scanline" />
              </div>
            </>
          ) : (
            <img src={previewUrl} alt="Selfie capturada" className="bio-scanner__preview" />
          )}

          <div className={`bio-scanner__chip bio-scanner__chip--${captured ? "success" : status}`}>
            {captured ? "✓ Selfie verificada" : statusText}
          </div>
        </div>

        <aside className="bio-scanner__panel">
          <div className="bio-scanner__mini-steps" aria-label="Progreso de captura">
            {STEPS.map((s, i) => (
              <div
                key={s.key}
                className={`bio-scanner__mini-step ${i < activeStep ? "bio-scanner__mini-step--done" : ""} ${i === activeStep ? "bio-scanner__mini-step--current" : ""}`}
              >
                <span className="bio-scanner__mini-dot" />
                <span>{s.label}</span>
              </div>
            ))}
          </div>

          <ul className="bio-scanner__tips">
            <li className={activeStep >= 1 ? "bio-scanner__tip--on" : ""}>Centra tu rostro en el óvalo</li>
            <li className={activeStep >= 1 ? "bio-scanner__tip--on" : ""}>Buena iluminación frontal</li>
            <li className={activeStep >= 2 ? "bio-scanner__tip--on" : ""}>Parpadea cuando se indique</li>
          </ul>

          {showCaptureBtn && (
            <button
              type="button"
              className="bio-scanner__capture-btn"
              onClick={triggerManualCapture}
            >
              Capturar selfie
            </button>
          )}

          {captured && (
            <button type="button" className="bio-scanner__retake" onClick={handleRetake}>
              ↺ Repetir selfie
            </button>
          )}
        </aside>
      </div>

      <style>{`
        .bio-scanner { width: 100%; }

        .bio-scanner__layout {
          display: grid;
          gap: 0.75rem;
        }

        .bio-scanner__viewport {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 3;
          border-radius: 14px;
          overflow: hidden;
          background: #0a0f1a;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .bio-scanner--embedded .bio-scanner__viewport {
          border-radius: 12px;
        }

        .bio-scanner__loading {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          background: #0a0f1a;
          color: rgba(255,255,255,0.6);
          font-size: 0.78rem;
        }

        .bio-scanner__spinner {
          width: 1.75rem;
          height: 1.75rem;
          border: 2px solid rgba(255,255,255,0.15);
          border-top-color: #60a5fa;
          border-radius: 50%;
          animation: bio-spin 0.8s linear infinite;
        }

        @keyframes bio-spin { to { transform: rotate(360deg); } }

        .bio-scanner__video,
        .bio-scanner__preview {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scaleX(-1);
        }

        .bio-scanner__mask {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(
            ellipse 42% 50% at 50% 44%,
            transparent 55%,
            rgba(0,0,0,0.72) 100%
          );
        }

        .bio-scanner__oval {
          position: absolute;
          top: 14%;
          left: 50%;
          width: 52%;
          height: 62%;
          transform: translateX(-50%);
          border: 2px solid rgba(255,255,255,0.55);
          border-radius: 50%;
          box-shadow: 0 0 0 9999px rgba(0,0,0,0.45);
          transition: border-color 0.3s, box-shadow 0.3s;
        }

        .bio-scanner__oval--pulse {
          animation: bio-pulse 1.8s ease-in-out infinite;
          border-color: #60a5fa;
        }

        .bio-scanner__oval--warn {
          border-color: #fbbf24;
          animation: bio-pulse 1.2s ease-in-out infinite;
        }

        @keyframes bio-pulse {
          0%, 100% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.45), 0 0 0 0 rgba(96,165,250,0.3); }
          50% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.45), 0 0 0 8px rgba(96,165,250,0.15); }
        }

        .bio-scanner__scanline {
          position: absolute;
          left: 22%;
          right: 22%;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(96,165,250,0.6), transparent);
          animation: bio-scan 2.5s ease-in-out infinite;
          opacity: 0.6;
        }

        @keyframes bio-scan {
          0%, 100% { top: 20%; opacity: 0; }
          10% { opacity: 0.6; }
          50% { top: 72%; opacity: 0.6; }
          60% { opacity: 0; }
        }

        .bio-scanner__chip {
          position: absolute;
          bottom: 0.65rem;
          left: 50%;
          transform: translateX(-50%);
          max-width: 92%;
          padding: 0.35rem 0.75rem;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          background: rgba(0,0,0,0.65);
          color: rgba(255,255,255,0.9);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.1);
        }

        .bio-scanner__chip--success {
          background: rgba(16, 185, 129, 0.88);
          border-color: transparent;
          color: #fff;
        }

        .bio-scanner__chip--no_face {
          background: rgba(251, 191, 36, 0.2);
          border-color: rgba(251, 191, 36, 0.4);
          color: #fde68a;
        }

        .bio-scanner__chip--ready {
          background: rgba(16, 185, 129, 0.25);
          border-color: rgba(52, 211, 153, 0.4);
          color: #6ee7b7;
        }

        .bio-scanner__panel {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
        }

        .bio-scanner__mini-steps {
          display: flex;
          gap: 0.35rem;
        }

        .bio-scanner__mini-step {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.62rem;
          font-weight: 600;
          color: rgba(255,255,255,0.3);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .bio-scanner__mini-dot {
          width: 0.45rem;
          height: 0.45rem;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          transition: all 0.25s;
        }

        .bio-scanner__mini-step--current {
          color: #93c5fd;
        }
        .bio-scanner__mini-step--current .bio-scanner__mini-dot {
          background: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.25);
        }

        .bio-scanner__mini-step--done {
          color: #6ee7b7;
        }
        .bio-scanner__mini-step--done .bio-scanner__mini-dot {
          background: #10b981;
        }

        .bio-scanner__tips {
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .bio-scanner__tips li {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.35);
          padding-left: 1rem;
          position: relative;
          transition: color 0.2s;
        }

        .bio-scanner__tips li::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0.45em;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
        }

        .bio-scanner__tip--on {
          color: rgba(255,255,255,0.75);
        }
        .bio-scanner__tip--on::before {
          background: #3b82f6;
        }

        .bio-scanner__retake {
          align-self: flex-start;
          padding: 0.4rem 0.85rem;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.06);
          color: #e2e8f0;
          font-size: 0.72rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .bio-scanner__retake:hover {
          background: rgba(255,255,255,0.12);
        }

        .bio-scanner__capture-btn {
          width: 100%;
          margin-top: 0.25rem;
          padding: 0.55rem 1rem;
          border: none;
          border-radius: 999px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: #fff;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .bio-scanner__capture-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(59, 130, 246, 0.45);
        }
        .bio-scanner__capture-btn:active {
          transform: translateY(0);
        }

        @media (min-width: 640px) {
          .bio-scanner__layout {
            grid-template-columns: 1.35fr 1fr;
            align-items: stretch;
          }
          .bio-scanner__viewport { min-height: 220px; }
        }

        .bio-scanner--compact .bio-scanner__layout {
          grid-template-columns: 1fr 0.9fr;
          gap: 0.45rem;
        }
        .bio-scanner--compact .bio-scanner__viewport {
          aspect-ratio: 4 / 3;
          min-height: 0;
          max-height: 200px;
        }
        .bio-scanner--compact .bio-scanner__panel { gap: 0.35rem; }
        .bio-scanner--compact .bio-scanner__mini-step { font-size: 0.55rem; }
        .bio-scanner--compact .bio-scanner__tips li { font-size: 0.62rem; }
        .bio-scanner--compact .bio-scanner__chip { font-size: 0.62rem; padding: 0.25rem 0.55rem; }
        .bio-scanner--compact .bio-scanner__retake { font-size: 0.62rem; padding: 0.3rem 0.65rem; }

        @media (max-width: 639px) {
          .bio-scanner__viewport {
            aspect-ratio: 3 / 4;
            min-height: 280px;
          }
          .bio-scanner__panel {
            flex-direction: row;
            flex-wrap: wrap;
            align-items: center;
            justify-content: space-between;
          }
          .bio-scanner__mini-steps { flex: 1; min-width: 100%; }
          .bio-scanner__tips {
            flex-direction: row;
            flex-wrap: wrap;
            gap: 0.4rem 0.75rem;
            flex: 1;
          }
          .bio-scanner__tips li { font-size: 0.68rem; }
        }
      `}</style>
    </div>
  );
}
