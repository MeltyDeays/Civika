import { useEffect } from "react";
import BiometricScanner from "./BiometricScanner";
import CedulaUploadCard from "./CedulaUploadCard";
import { preloadFaceMesh } from "./faceMeshLoader";

/**
 * Sección unificada: selfie en vivo + cédula frente/atrás.
 */
export default function BiometricIdentitySection({
  onSelfieCapture,
  selfieDone = false,
  frenteInputRef,
  atrasInputRef,
  cedulaFrenteUrl,
  cedulaAtrasUrl,
  onCedulaFrente,
  onCedulaAtras,
  disabled = false,
  compact = false,
  light = false,
}) {
  const cedulaDone = Boolean(cedulaFrenteUrl && cedulaAtrasUrl);
  const steps = [
    { id: "selfie", label: "Selfie", done: selfieDone },
    { id: "cedula", label: "Cédula", done: cedulaDone },
  ];
  const completedCount = steps.filter((s) => s.done).length;

  useEffect(() => {
    preloadFaceMesh().catch(() => {});
  }, []);

  return (
    <section className={`bio-section ${compact ? "bio-section--compact" : ""} ${light ? "bio-section--light" : ""}`} aria-labelledby="bio-section-title">
      <header className="bio-section__header">
        <div className="bio-section__title-row">
          <span className="bio-section__icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </span>
          <h4 id="bio-section-title" className="bio-section__title">
            Validación biométrica
          </h4>
          <span className="bio-section__progress">{completedCount}/2</span>
        </div>
        <p className="bio-section__subtitle">
          Verificamos que eres una persona real y que tu cédula coincide con tu rostro.
        </p>

        <ol className="bio-section__steps" aria-label="Pasos de verificación">
          {steps.map((step, i) => (
            <li
              key={step.id}
              className={`bio-section__step ${step.done ? "bio-section__step--done" : ""} ${!step.done && (i === 0 || steps[i - 1].done) ? "bio-section__step--active" : ""}`}
            >
              <span className="bio-section__step-num">
                {step.done ? "✓" : i + 1}
              </span>
              <span>{step.label}</span>
            </li>
          ))}
        </ol>
      </header>

      <div className="bio-section__body">
        <div className="bio-section__scanner-wrap">
          <BiometricScanner
            onCapture={onSelfieCapture}
            disabled={disabled}
            embedded
            compact={compact}
          />
        </div>

        <div className="bio-section__cedula-block">
          <div className="bio-section__divider">
            <span>Documento de identidad</span>
          </div>

          <div className="bio-section__cedula-grid">
            <CedulaUploadCard
              id="frenteInput"
              label="Cédula frente"
              sideLabel="Lado frontal"
              previewUrl={cedulaFrenteUrl}
              inputRef={frenteInputRef}
              onChange={onCedulaFrente}
              done={Boolean(cedulaFrenteUrl)}
              compact={compact}
            />
            <CedulaUploadCard
              id="atrasInput"
              label="Cédula atrás"
              sideLabel="Lado trasero"
              previewUrl={cedulaAtrasUrl}
              inputRef={atrasInputRef}
              onChange={onCedulaAtras}
              done={Boolean(cedulaAtrasUrl)}
              compact={compact}
            />
          </div>
        </div>
      </div>

      <style>{`
        .bio-section {
          margin: 1.25rem 0;
          padding: 1rem;
          border-radius: 18px;
          background: rgba(0,0,0,0.28);
          border: 1px solid rgba(255,255,255,0.08);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          height: 100%;
        }
        .bio-section--compact {
          margin: 0;
          padding: 0.65rem 0.75rem;
          gap: 0.5rem;
          border-radius: 14px;
        }
        .bio-section--compact .bio-section__title { font-size: 0.82rem; }
        .bio-section--compact .bio-section__subtitle { font-size: 0.68rem; line-height: 1.35; }
        .bio-section--compact .bio-section__step { font-size: 0.65rem; padding: 0.3rem 0.45rem; }
        .bio-section__body {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          flex: 1;
          min-height: 0;
        }
        .bio-section--compact .bio-section__body {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.55rem;
        }
        @media (min-width: 900px) {
          .bio-section--compact .bio-section__body {
            grid-template-columns: 1.15fr 0.85fr;
            align-items: stretch;
          }
          .bio-section--compact .bio-section__cedula-block {
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 0.45rem;
          }
        }
        .bio-section__header { display: flex; flex-direction: column; gap: 0.5rem; }
        .bio-section__title-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .bio-section__icon {
          display: grid;
          place-items: center;
          width: 2rem;
          height: 2rem;
          border-radius: 10px;
          background: rgba(59, 130, 246, 0.18);
          color: #93c5fd;
        }
        .bio-section__title {
          margin: 0;
          flex: 1;
          font-size: 0.95rem;
          font-weight: 700;
          color: #fff;
        }
        .bio-section__progress {
          font-size: 0.7rem;
          font-weight: 700;
          color: #94a3b8;
          background: rgba(255,255,255,0.06);
          padding: 0.2rem 0.5rem;
          border-radius: 999px;
        }
        .bio-section__subtitle {
          margin: 0;
          font-size: 0.78rem;
          line-height: 1.45;
          color: rgba(255,255,255,0.55);
        }
        .bio-section__steps {
          display: flex;
          gap: 0.5rem;
          list-style: none;
          margin: 0.25rem 0 0;
          padding: 0;
        }
        .bio-section__step {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.72rem;
          font-weight: 600;
          color: rgba(255,255,255,0.35);
          padding: 0.4rem 0.55rem;
          border-radius: 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid transparent;
          transition: all 0.2s;
        }
        .bio-section__step--active {
          color: #e2e8f0;
          border-color: rgba(96, 165, 250, 0.35);
          background: rgba(59, 130, 246, 0.1);
        }
        .bio-section__step--done {
          color: #6ee7b7;
          border-color: rgba(52, 211, 153, 0.3);
          background: rgba(16, 185, 129, 0.08);
        }
        .bio-section__step-num {
          width: 1.15rem;
          height: 1.15rem;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 0.62rem;
          background: rgba(255,255,255,0.08);
        }
        .bio-section__step--done .bio-section__step-num {
          background: #10b981;
          color: #fff;
        }
        .bio-section__step--active .bio-section__step-num {
          background: #3b82f6;
          color: #fff;
        }
        .bio-section__scanner-wrap {
          border-radius: 14px;
          overflow: hidden;
        }
        .bio-section__divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: rgba(255,255,255,0.35);
          font-size: 0.68rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .bio-section__divider::before,
        .bio-section__divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.1);
        }
        .bio-section__cedula-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        @media (max-width: 400px) {
          .bio-section__cedula-grid { grid-template-columns: 1fr; }
        }
        .bio-section--light {
          background: #f8f6f4;
          border-color: rgba(122, 24, 53, 0.12);
        }
        .bio-section--light .bio-section__title { color: #0a0a0a; }
        .bio-section--light .bio-section__subtitle { color: #64748b; }
        .bio-section--light .bio-section__icon {
          background: rgba(122, 24, 53, 0.1);
          color: #7A1835;
        }
        .bio-section--light .bio-section__step {
          background: rgba(122, 24, 53, 0.04);
          color: #94a3b8;
        }
        .bio-section--light .bio-section__step--active {
          color: #7A1835;
          border-color: rgba(122, 24, 53, 0.25);
          background: rgba(122, 24, 53, 0.08);
        }
        .bio-section--light .bio-section__step--active .bio-section__step-num {
          background: #7A1835;
        }
        .bio-section--light .bio-section__step--done {
          color: #15803d;
          border-color: rgba(21, 128, 61, 0.25);
          background: rgba(21, 128, 61, 0.06);
        }
        .bio-section--light .bio-section__divider { color: #94a3b8; }
        .bio-section--light .bio-section__divider::before,
        .bio-section--light .bio-section__divider::after {
          background: rgba(122, 24, 53, 0.12);
        }
        /* Estilos correctores de contraste en modo claro */
        .bio-section--light .cedula-card__label {
          color: #1e293b;
        }
        .bio-section--light .cedula-card__dropzone {
          border-color: rgba(122, 24, 53, 0.25);
          background: rgba(122, 24, 53, 0.02);
        }
        .bio-section--light .cedula-card__dropzone:hover {
          border-color: #7A1835;
          background: rgba(122, 24, 53, 0.06);
        }
        .bio-section--light .cedula-card__placeholder {
          color: #475569;
        }
        .bio-section--light .cedula-card__side {
          color: #0f172a;
        }
        .bio-section--light .cedula-card__tap {
          color: #475569;
          opacity: 0.95;
        }
        .bio-section--light .bio-scanner__mini-step {
          color: #64748b;
        }
        .bio-section--light .bio-scanner__mini-dot {
          background: #cbd5e1;
        }
        .bio-section--light .bio-scanner__mini-step--current {
          color: #7A1835;
        }
        .bio-section--light .bio-scanner__mini-step--current .bio-scanner__mini-dot {
          background: #7A1835;
          box-shadow: 0 0 0 3px rgba(122, 24, 53, 0.22);
        }
        .bio-section--light .bio-scanner__mini-step--done {
          color: #16a34a;
        }
        .bio-section--light .bio-scanner__mini-step--done .bio-scanner__mini-dot {
          background: #16a34a;
        }
        .bio-section--light .bio-scanner__tips li {
          color: #475569;
        }
        .bio-section--light .bio-scanner__tips li::before {
          background: #cbd5e1;
        }
        .bio-section--light .bio-scanner__tip--on {
          color: #0f172a;
          font-weight: 500;
        }
        .bio-section--light .bio-scanner__tip--on::before {
          background: #7A1835;
        }
        .bio-section--light .bio-scanner__retake {
          border-color: rgba(122, 24, 53, 0.28);
          background: rgba(122, 24, 53, 0.04);
          color: #7a1835;
        }
        .bio-section--light .bio-scanner__retake:hover {
          background: rgba(122, 24, 53, 0.08);
        }
      `}</style>
    </section>
  );
}
