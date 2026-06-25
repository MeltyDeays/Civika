import { useState, lazy, Suspense } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

import CivicReportsLogo from "../Components/ui/CivicReportsLogo";
import CivicNetworkWatermark from "../Components/ui/CivicNetworkWatermark";

const CanvasRevealEffect = lazy(() => import("../Components/ui/canvas-reveal-effect"));

export default function VistaInicioSesion({ alIniciarSesion, cargandoSesion, alIrRegistro }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [initialCanvasVisible, setInitialCanvasVisible] = useState(true);
  const [reverseCanvasVisible, setReverseCanvasVisible] = useState(false);

  const manejarEnvio = async (event) => {
    event.preventDefault();
    if (enviando || cargandoSesion) return;

    setError("");
    setEnviando(true);
    try {
      setReverseCanvasVisible(true);
      setTimeout(() => setInitialCanvasVisible(false), 50);
      await alIniciarSesion(email, password);
      setShowSuccess(true);
    } catch (e) {
      setError(e.message || "Credenciales incorrectas. Intenta de nuevo.");
      setEnviando(false);
      setReverseCanvasVisible(false);
      setInitialCanvasVisible(true);
    }
  };

  return (
    <div className="sif-root">
      <div className="sif-bg">
        <div className="sif-bg-base" aria-hidden="true" />
        <CivicNetworkWatermark />
        <div className="sif-bg-dots" aria-hidden="true" />
        <Suspense fallback={null}>
          {(initialCanvasVisible || reverseCanvasVisible) && (
            <div className="sif-canvas-layer">
              <CanvasRevealEffect
                key={reverseCanvasVisible ? "outro" : "intro"}
                animationSpeed={reverseCanvasVisible ? 4 : 2.5}
                containerClassName="sif-canvas-bg"
                colors={[[122, 24, 53], [92, 18, 36], [155, 35, 71]]}
                dotSize={4}
                reverse={reverseCanvasVisible}
              />
            </div>
          )}
        </Suspense>
      </div>

      <div className="sif-content">
        <SifNavbar alIrRegistro={alIrRegistro} />

        <div className="sif-form-area">
          <div className="sif-form-container">
            <AnimatePresence mode="wait">
              {showSuccess ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut", delay: 0.3 }}
                  className="sif-step-content"
                >
                  <div className="sif-step-header">
                    <h1 className="sif-title">¡Bienvenido!</h1>
                    <p className="sif-subtitle">Acceso concedido</p>
                  </div>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="sif-success-icon-wrap"
                  >
                    <div className="sif-success-circle">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="32" height="32">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="sif-step-content"
                >
                  <div className="sif-step-header">
                    <CivicReportsLogo height={48} className="sif-header-logo" />
                    <p className="sif-subtitle">Gestión Ciudadana Inteligente</p>
                  </div>

                  <div className="sif-fields-group">
                    <button type="button" className="sif-google-btn" onClick={alIrRegistro}>
                      <span className="sif-google-icon">🏛️</span>
                      <span>Crear nueva cuenta</span>
                    </button>

                    <div className="sif-divider">
                      <div className="sif-divider-line" />
                      <span className="sif-divider-text">o inicia sesión</span>
                      <div className="sif-divider-line" />
                    </div>

                    <form onSubmit={manejarEnvio}>
                      <div className="sif-input-wrap">
                        <input
                          type="email"
                          id="email"
                          name="email"
                          placeholder="correo@ejemplo.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="sif-input"
                          required
                          autoComplete="username"
                        />
                      </div>

                      <div className="sif-input-wrap" style={{ marginTop: "12px" }}>
                        <input
                          type="password"
                          id="password"
                          name="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="sif-input"
                          required
                          autoComplete="current-password"
                        />
                        <button type="submit" className="sif-submit-arrow" disabled={enviando}>
                          {enviando ? (
                            <span className="sif-spinner" />
                          ) : (
                            <span className="sif-arrow-wrap">
                              <span className="sif-arrow-default">→</span>
                              <span className="sif-arrow-hover">→</span>
                            </span>
                          )}
                        </button>
                      </div>

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="sif-error"
                        >
                          {error}
                        </motion.div>
                      )}
                    </form>
                  </div>

                  <p className="sif-legal">
                    © 2026 CivicReports Nicaragua. Todos los derechos reservados.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: SIF_STYLES }} />
    </div>
  );
}

function SifNavbar({ alIrRegistro }) {
  const LANDING = "https://precious-crostata-10c1d1.netlify.app";

  return (
    <header className="sif-navbar">
      <div className="sif-navbar-inner">
        <a href={LANDING} target="_blank" rel="noopener noreferrer" className="sif-nav-logo-link">
          <CivicReportsLogo height={28} />
        </a>

        <div className="sif-nav-actions">
          <button className="sif-nav-login-btn" onClick={alIrRegistro}>
            Crear cuenta
          </button>
        </div>
      </div>
    </header>
  );
}

const SIF_STYLES = `
  .sif-root {
    display: flex;
    width: 100%;
    flex-direction: column;
    min-height: 100vh;
    background: #f7f5f2;
    position: relative;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    --cr-maroon: #7A1835;
    --cr-maroon-dark: #5C1228;
    --cr-ink: #0a0a0a;
    --cr-muted: #64748b;
  }

  .sif-bg {
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;
  }

  .sif-bg-base {
    position: absolute;
    inset: 0;
    background: linear-gradient(160deg, #fafafa 0%, #f3f1ee 45%, #ece8e4 100%);
  }

  .sif-bg-dots {
    position: absolute;
    inset: 0;
    opacity: 0.45;
    background-image: radial-gradient(circle, rgba(122, 24, 53, 0.07) 1px, transparent 1px);
    background-size: 28px 28px;
    mask-image: radial-gradient(ellipse 85% 75% at 50% 40%, black 15%, transparent 100%);
  }

  .sif-canvas-layer {
    position: absolute;
    inset: 0;
    opacity: 0.35;
  }

  .sif-canvas-bg {
    height: 100%;
    width: 100%;
    position: relative;
    background: transparent;
  }

  .cre-container {
    height: 100%;
    position: relative;
    width: 100%;
  }

  .cre-inner {
    height: 100%;
    width: 100%;
  }

  .cre-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(247, 245, 242, 0.9) 0%, transparent 55%);
  }

  .cre-canvas {
    position: absolute;
    inset: 0;
    height: 100%;
    width: 100%;
  }

  .sif-radial-overlay {
    display: none;
  }

  .sif-top-gradient {
    display: none;
  }

  .sif-content {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  /* Navbar */
  .sif-navbar {
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 20;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 16px 8px 14px;
    backdrop-filter: blur(14px);
    border-radius: 9999px;
    border: 1px solid rgba(122, 24, 53, 0.1);
    background: rgba(255, 255, 255, 0.88);
    box-shadow: 0 4px 24px rgba(122, 24, 53, 0.07);
    width: calc(100% - 2rem);
    max-width: 900px;
  }

  .sif-navbar-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 16px;
  }

  .sif-nav-logo-link {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    flex-shrink: 0;
  }

  .sif-nav-brand {
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.02em;
    display: none;
  }

  @media (min-width: 768px) {
    .sif-nav-brand { display: inline; }
  }

  .sif-nav-logo {
    position: relative;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .sif-nav-dot {
    position: absolute;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #e5e5e5;
    opacity: 0.8;
  }

  .sif-dot-top { top: 0; left: 50%; transform: translateX(-50%); }
  .sif-dot-left { left: 0; top: 50%; transform: translateY(-50%); }
  .sif-dot-right { right: 0; top: 50%; transform: translateY(-50%); }
  .sif-dot-bottom { bottom: 0; left: 50%; transform: translateX(-50%); }

  .sif-nav-links {
    display: none;
    align-items: center;
    gap: 20px;
  }

  @media (min-width: 900px) {
    .sif-nav-links { display: flex; }
  }

  .sif-nav-link {
    font-size: 13px;
    color: rgba(255,255,255,0.55);
    text-decoration: none;
    transition: color 0.2s;
    white-space: nowrap;
  }
  .sif-nav-link:hover { color: #fff; }

  .sif-nav-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .sif-nav-login-btn {
    padding: 7px 16px;
    font-size: 12px;
    font-weight: 600;
    border: none;
    background: linear-gradient(135deg, var(--cr-maroon) 0%, var(--cr-maroon-dark) 100%);
    color: #fff;
    border-radius: 9999px;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    box-shadow: 0 4px 14px rgba(122, 24, 53, 0.25);
  }
  .sif-nav-login-btn:hover {
    filter: brightness(1.08);
    transform: translateY(-1px);
  }

  .sif-nav-beta-btn {
    padding: 7px 14px;
    font-size: 12px;
    font-weight: 600;
    border: none;
    background: linear-gradient(135deg, #f0b850, #DCA642);
    color: #000;
    border-radius: 9999px;
    text-decoration: none;
    white-space: nowrap;
    transition: all 0.2s;
  }
  .sif-nav-beta-btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
    filter: blur(16px);
    pointer-events: none;
    transition: all 0.3s ease-out;
  }

  .sif-nav-signup-glow:hover .sif-nav-signup-blur {
    opacity: 0.6;
    filter: blur(20px);
    inset: -12px;
  }

  .sif-nav-signup-btn {
    position: relative;
    z-index: 1;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 600;
    color: #000;
    background: linear-gradient(to bottom right, #f3f4f6, #d1d5db);
    border: none;
    border-radius: 9999px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .sif-nav-signup-btn:hover { background: linear-gradient(to bottom right, #e5e7eb, #9ca3af); }

  /* Form Area */
  .sif-form-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .sif-form-container {
    width: 100%;
    max-width: 420px;
    margin-top: 130px;
    padding: 1.75rem 1.5rem;
    background: rgba(255, 255, 255, 0.94);
    border: 1px solid rgba(122, 24, 53, 0.1);
    border-radius: 20px;
    box-shadow: 0 20px 56px rgba(122, 24, 53, 0.07);
  }

  .sif-header-logo {
    margin: 0 auto 6px;
    filter: drop-shadow(0 2px 6px rgba(122, 24, 53, 0.08));
  }

  .sif-step-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
    text-align: center;
  }

  .sif-step-header { display: flex; flex-direction: column; gap: 4px; }

  .sif-title {
    font-size: 2.5rem;
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--cr-ink);
    margin: 0;
  }

  .sif-subtitle {
    font-size: 0.9rem;
    color: var(--cr-muted);
    font-weight: 500;
    margin: 0;
  }

  .sif-fields-group {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .sif-google-btn {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #fff;
    color: var(--cr-maroon);
    border: 1px solid rgba(122, 24, 53, 0.18);
    border-radius: 9999px;
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s, box-shadow 0.2s;
  }
  .sif-google-btn:hover {
    background: rgba(122, 24, 53, 0.04);
    box-shadow: 0 4px 14px rgba(122, 24, 53, 0.1);
  }

  .sif-google-icon { font-size: 18px; }

  .sif-divider {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .sif-divider-line {
    flex: 1;
    height: 1px;
    background: rgba(122, 24, 53, 0.12);
  }

  .sif-divider-text {
    color: var(--cr-muted);
    font-size: 13px;
  }

  .sif-input-wrap {
    position: relative;
  }

  .sif-input {
    width: 100%;
    background: #fff;
    color: var(--cr-ink);
    border: 1px solid rgba(122, 24, 53, 0.14);
    border-radius: 9999px;
    padding: 12px 16px;
    font-size: 15px;
    outline: none;
    text-align: center;
    box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .sif-input:focus {
    border-color: rgba(122, 24, 53, 0.45);
    box-shadow: 0 0 0 3px rgba(122, 24, 53, 0.08);
  }
  .sif-input::placeholder { color: #94a3b8; }

  .sif-submit-arrow {
    position: absolute;
    right: 6px;
    top: 6px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--cr-maroon) 0%, var(--cr-maroon-dark) 100%);
    border: none;
    color: #fff;
    cursor: pointer;
    overflow: hidden;
    transition: filter 0.2s;
    box-shadow: 0 4px 12px rgba(122, 24, 53, 0.25);
  }
  .sif-submit-arrow:hover { filter: brightness(1.08); }
  .sif-submit-arrow:disabled { opacity: 0.5; cursor: not-allowed; }

  .sif-arrow-wrap {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: hidden;
    transition: transform 0.3s;
  }

  .sif-arrow-default,
  .sif-arrow-hover {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s;
  }

  .sif-arrow-hover { transform: translateX(-100%); }

  .sif-submit-arrow:hover .sif-arrow-default { transform: translateX(100%); }
  .sif-submit-arrow:hover .sif-arrow-hover { transform: translateX(0); }

  .sif-spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    border-top-color: #fff;
    animation: sif-spin 0.8s linear infinite;
  }

  @keyframes sif-spin {
    to { transform: rotate(360deg); }
  }

  .sif-error {
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.22);
    color: #b91c1c;
    padding: 12px;
    border-radius: 12px;
    font-size: 13px;
    text-align: center;
    margin-top: 8px;
  }

  .sif-legal {
    font-size: 12px;
    color: #94a3b8;
    padding-top: 24px;
    margin: 0;
  }

  .sif-success-icon-wrap {
    padding: 40px 0;
    display: flex;
    justify-content: center;
  }

  .sif-success-circle {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--cr-maroon) 0%, var(--cr-maroon-dark) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    box-shadow: 0 8px 24px rgba(122, 24, 53, 0.3);
  }
`;
