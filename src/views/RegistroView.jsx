import { useState, useRef } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

import CivicReportsLogo from "../Components/ui/CivicReportsLogo";
import CivicNetworkWatermark from "../Components/ui/CivicNetworkWatermark";
import { verificarIdentidadBiometrica } from "../services/biometricClient";
import BiometricIdentitySection from "../modules/auth/components/BiometricIdentitySection";
const CODIGOS_MUNICIPIOS_NICARAGUA = new Set([
  "001", "002", "003", "004", "005", "006", "007", "008", "009",
  "041", "042", "043", "044", "045", "046", "047", "048",
  "049", "050", "051", "052", "053", "054",
  "081", "082", "083", "084", "085", "086", "087", "088", "089", "090", "091", "092", "093",
  "121", "122", "123", "124", "125", "126", "127", "128", "129", "130",
  "161", "162", "163", "164",
  "201", "202", "203", "204", "205", "206",
  "241", "242", "243", "244", "245", "246", "247", "248",
  "281", "282", "283", "284", "285", "286", "287", "288", "289", "290",
  "361", "362", "363", "364", "365", "366", "367", "368", "369",
  "401", "402", "403", "404", "405", "406", "407", "408", "409",
  "441", "442", "443", "444", "445", "446", "447", "448", "449", "450", "451", "452", "453",
  "481", "482", "483", "484", "485", "486", "487", "488", "489", "490", "491", "492",
  "521", "522", "523", "524", "525", "526",
  "561", "562", "563", "564", "565", "566", "567", "568", "569", "570",
  "601", "602", "603", "604", "605", "606", "607", "608",
  "616", "617", "618", "619", "620", "621", "622", "623", "624", "625", "626"
]);

export default function VistaRegistro({ alRegistroCiudadano, alRegistroInstitucional, alRegistroTecnico, alIrLogin }) {
  const [tab, setTab] = useState("ciudadano");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [cedula, setCedula] = useState("");
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [codigoInvitacion, setCodigoInvitacion] = useState("");

  const [selfie, setSelfie] = useState(null);
  const [cedulaFrente, setCedulaFrente] = useState(null);
  const [cedulaFrenteUrl, setCedulaFrenteUrl] = useState("");
  const [cedulaAtras, setCedulaAtras] = useState(null);
  const [cedulaAtrasUrl, setCedulaAtrasUrl] = useState("");

  const [selfieBase64, setSelfieBase64] = useState("");
  const [cedulaFrenteBase64, setCedulaFrenteBase64] = useState("");
  const [cedulaAtrasBase64, setCedulaAtrasBase64] = useState("");

  const [validandoIdentidad, setValidandoIdentidad] = useState(false);
  const [mensajeValidacion, setMensajeValidacion] = useState("");

  const [selfieCapturada, setSelfieCapturada] = useState(false);

  const frenteInputRef = useRef(null);
  const atrasInputRef = useRef(null);

  const convertirABase64 = (file) => {
    console.log("convertirABase64 - Procesando archivo:", { nombre: file.name, tipo: file.type, tamaño: file.size });
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        console.warn("convertirABase64 - Omitiendo compresión, tipo no es imagen:", file.type);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          const base64Str = reader.result.split(',')[1];
          resolve(base64Str);
        };
        reader.onerror = error => reject(error);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          console.log("convertirABase64 - Imagen cargada en Image():", { width: img.width, height: img.height });
          const canvas = document.createElement("canvas");
          const maxDimension = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          const base64Str = dataUrl.split(",")[1];
          console.log("convertirABase64 - Compresión exitosa. Base64 largo:", base64Str.length);
          resolve(base64Str);
        };
        img.onerror = (e) => {
          console.warn("convertirABase64 - Falló carga de imagen en Image. Fallback sin compresión. Evento:", e);
          const fbReader = new FileReader();
          fbReader.readAsDataURL(file);
          fbReader.onload = () => {
            const base64Str = fbReader.result.split(',')[1];
            resolve(base64Str);
          };
          fbReader.onerror = error => reject(error);
        };
        img.src = event.target.result;
      };
      reader.onerror = error => reject(error);
    });
  };

  const manejarCapturaSelfie = (blob, base64) => {
    const file = new File([blob], "selfie-camara.jpg", { type: "image/jpeg" });
    setSelfie(file);
    setSelfieBase64(base64);
    setSelfieCapturada(true);
  };

  const manejarCedulaFrente = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCedulaFrente(file);
    setCedulaFrenteUrl(URL.createObjectURL(file));
    try {
      const b64 = await convertirABase64(file);
      setCedulaFrenteBase64(b64);
    } catch (err) {
      console.error(err);
    }
  };

  const manejarCedulaAtras = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCedulaAtras(file);
    setCedulaAtrasUrl(URL.createObjectURL(file));
    try {
      const b64 = await convertirABase64(file);
      setCedulaAtrasBase64(b64);
    } catch (err) {
      console.error(err);
    }
  };

  const formatearCedula = (valor) => {
    let limpio = valor.replace(/[^0-9a-zA-Z]/g, "").toUpperCase().slice(0, 14);
    let nums = limpio.slice(0, 13).replace(/\D/g, "");
    let letra = limpio.slice(13, 14).replace(/[^A-Z]/g, "");
    let result = nums + letra;
    if (result.length <= 3) return result;
    if (result.length <= 9) return `${result.slice(0, 3)}-${result.slice(3)}`;
    return `${result.slice(0, 3)}-${result.slice(3, 9)}-${result.slice(9)}`;
  };

  const manejarEnvio = async (event) => {
    event.preventDefault();
    if (enviando) return;

    setError("");
    setExito("");

    if (password !== confirmarPassword) { setError("Las contraseñas no coinciden."); return; }
    if (password.length <= 6) { setError("La contraseña debe tener más de 6 caracteres."); return; }
    
    const tieneMayuscula = /[A-Z]/.test(password);
    const tieneMinuscula = /[a-z]/.test(password);
    const tieneNumero = /\d/.test(password);
    const tieneSimbolo = new RegExp('[!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>/?#*]').test(password);

    if (!tieneMayuscula || !tieneMinuscula) {
      setError("La contraseña debe contener letras mayúsculas y minúsculas.");
      return;
    }
    if (!tieneNumero) {
      setError("La contraseña debe contener al menos un número.");
      return;
    }
    if (!tieneSimbolo) {
      setError("La contraseña debe contener al menos un símbolo especial (ej. #, *, @, $, etc.).");
      return;
    }

    setEnviando(true);
    try {
      let verificadoIa = false;
      let motivoRechazoIa = null;

      if (tab !== "institucional") {
        const regexCedula = /^(\d{3})-(\d{6})-(\d{4})([A-Z])$/;
        if (!cedula || !regexCedula.test(cedula)) {
          throw new Error("Ingresa una cédula nicaragüense válida (ej. 121-041204-1006N).");
        }

        const matches = cedula.match(regexCedula);
        const municipioCod = matches[1];
        const fechaCod = matches[2];

        if (!CODIGOS_MUNICIPIOS_NICARAGUA.has(municipioCod)) {
          throw new Error(`Código de municipio '${municipioCod}' no válido en la cédula de Nicaragua.`);
        }

        const dia = parseInt(fechaCod.slice(0, 2), 10);
        const mes = parseInt(fechaCod.slice(2, 4), 10);
        if (mes < 1 || mes > 12 || dia < 1 || dia > 31) {
          throw new Error("La fecha de nacimiento en el formato de la cédula no es válida.");
        }

        const partesNombre = nombreCompleto.trim().split(/\s+/);
        if (partesNombre.length < 4) {
          throw new Error("El nombre completo debe incluir primer nombre, segundo nombre y ambos apellidos (ej. María Alejandra López Pérez).");
        }

        if (!selfie || !cedulaFrente || !cedulaAtras) {
          throw new Error("Por seguridad, debes capturar tu selfie en vivo y subir fotos de la cédula (frente y atrás) para validar tu identidad.");
        }

        if (!selfieCapturada || !selfieBase64) {
          throw new Error("Completa la prueba de vitalidad: parpadea frente a la cámara para capturar tu selfie.");
        }

        if (selfieBase64 === cedulaFrenteBase64 || cedulaFrenteBase64 === cedulaAtrasBase64 || selfieBase64 === cedulaAtrasBase64) {
          throw new Error("No puedes subir la misma imagen en campos diferentes. Por favor proporciona fotos distintas para la selfie, frente de la cédula y atrás de la cédula.");
        }

        setValidandoIdentidad(true);
        setMensajeValidacion("Validando vitalidad y autenticidad facial con el servidor biométrico...");

        const resultado = await verificarIdentidadBiometrica({
          selfieBase64,
          cedulaFrenteBase64,
          cedulaAtrasBase64,
          cedulaEscrita: cedula,
          nombreEscrito: nombreCompleto,
          livenessClient: true,
        });

        if (!resultado.valido) {
          throw new Error(`Verificación de identidad denegada: ${resultado.motivo}`);
        }

        verificadoIa = true;
        motivoRechazoIa = resultado.motivo;
        setMensajeValidacion("Registrando usuario y subiendo fotos de verificación...");
      }

      if (tab === "ciudadano") {
        await alRegistroCiudadano({
          email,
          password,
          cedula,
          nombreCompleto,
          selfieFile: selfie,
          cedulaFrenteFile: cedulaFrente,
          cedulaAtrasFile: cedulaAtras,
          verificado_ia: verificadoIa,
          motivo_rechazo_ia: motivoRechazoIa
        });
        setExito("¡Cuenta creada exitosamente! Ahora inicia sesión con tus credenciales. Redirigiendo al login...");
      } else if (tab === "institucional") {
        if (!codigoInvitacion.trim()) throw new Error("Ingresa el código de invitación.");
        await alRegistroInstitucional({ email, password, nombreCompleto, cedula, codigoInvitacion: codigoInvitacion.trim() });
        setExito("¡Registro institucional exitoso! Tu cuenta ha sido vinculada. Redirigiendo...");
      } else if (tab === "tecnico") {
        if (!codigoInvitacion.trim()) throw new Error("Ingresa el código de acceso.");
        await alRegistroTecnico({
          email,
          password,
          nombreCompleto,
          cedula,
          codigoInvitacion: codigoInvitacion.trim(),
          selfieFile: selfie,
          cedulaFrenteFile: cedulaFrente,
          cedulaAtrasFile: cedulaAtras,
          verificado_ia: verificadoIa,
          motivo_rechazo_ia: motivoRechazoIa
        });
        setExito("¡Registro técnico exitoso! Ya puedes iniciar sesión. Redirigiendo...");
      }

      // Limpiar campos
      setEmail("");
      setPassword("");
      setConfirmarPassword("");
      setCedula("");
      setNombreCompleto("");
      setCodigoInvitacion("");

      // Redirigir automáticamente al login después de 3 segundos
      setTimeout(() => {
        alIrLogin();
      }, 3000);
    } catch (e) {
      setError(e.message || "Error al registrarse. Intenta de nuevo.");
    } finally {
      setEnviando(false);
      setValidandoIdentidad(false);
    }
  };

  const tabs = [
    { id: "ciudadano", icon: "👤", label: "Ciudadano" },
    { id: "institucional", icon: "🏛️", label: "Institución" },
    { id: "tecnico", icon: "👷", label: "Técnico" },
  ];

  return (
    <div className="sif-root">
      <div className="sif-bg">
        <div className="sif-bg-base" aria-hidden="true" />
        <CivicNetworkWatermark />
        <div className="sif-bg-dots" aria-hidden="true" />
      </div>

      <div className="sif-content">
        <header className="sif-navbar">
          <div className="sif-navbar-inner">
            <a href="https://precious-crostata-10c1d1.netlify.app" target="_blank" rel="noopener noreferrer" className="sif-nav-logo-link">
              <CivicReportsLogo height={30} />
            </a>

            <div className="sif-nav-actions">
              <button className="sif-nav-login-btn" onClick={alIrLogin}>Iniciar Sesión</button>
            </div>
          </div>
        </header>

        <div className="sif-form-area">
          <div className="reg-form-container">
            <AnimatePresence mode="wait">
              {exito ? (
                <motion.div
                  key="exito"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="sif-step-content"
                >
                  <div className="sif-step-header">
                    <h1 className="sif-title">¡Registrado!</h1>
                    <p className="sif-subtitle" style={{ fontSize: "1.1rem" }}>{exito}</p>
                  </div>
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="sif-success-icon-wrap"
                  >
                    <div className="sif-success-circle">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="32" height="32">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </motion.div>
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="reg-submit-btn"
                    onClick={alIrLogin}
                  >
                    Ir a Iniciar Sesión
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="registro"
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="sif-step-content"
                >
                  <div className="reg-page-header">
                    <div className="reg-page-header__brand">
                      <CivicReportsLogo height={42} className="reg-header-logo" />
                      <p className="sif-subtitle">Selecciona tu tipo de cuenta</p>
                    </div>
                    <div className="reg-tabs">
                      {tabs.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          className={`reg-tab ${tab === t.id ? "reg-tab-active" : ""}`}
                          onClick={() => { setTab(t.id); setError(""); }}
                        >
                          <span className="reg-tab-icon">{t.icon}</span>
                          <span className="reg-tab-label">{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={manejarEnvio} className={`reg-form ${tab === "institucional" ? "reg-form--single" : ""}`} style={{ position: "relative" }}>
                    {validandoIdentidad && (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        style={{
                          position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                          background: "rgba(10, 15, 30, 0.95)", zIndex: 100, display: "flex", flexDirection: "column",
                          alignItems: "center", justifyContent: "center", borderRadius: "24px", padding: "2rem",
                          textAlign: "center"
                        }}
                      >
                        <div style={{ position: "relative", width: "120px", height: "120px", border: "2px solid rgba(59, 130, 246, 0.4)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: "1.5rem" }}>
                          <motion.div
                            animate={{ y: ["-100%", "100%", "-100%"] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            style={{
                              position: "absolute", width: "100%", height: "4px", background: "linear-gradient(90deg, transparent, #3b82f6, transparent)",
                              boxShadow: "0 0 12px #3b82f6", zIndex: 5
                            }}
                          />
                          <span style={{ fontSize: "3rem" }}>🤖</span>
                        </div>
                        <h4 style={{ color: "#fff", margin: "0 0 8px", fontSize: "1.2rem", fontWeight: "800" }}>Escaneo de Identidad en Progreso</h4>
                        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.9rem" }}>{mensajeValidacion}</p>
                      </motion.div>
                    )}

                    <div className="reg-form-layout">
                      <div className="reg-form-col reg-form-col--fields">
                        {tab !== "institucional" && (
                          <div className="reg-row">
                            <div className="reg-input-group" style={{ flex: 1.2 }}>
                              <label className="reg-label" htmlFor="nombreCompleto">Nombre Completo</label>
                              <input type="text" id="nombreCompleto" name="nombreCompleto" autoComplete="name" value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} required placeholder="Ej. María López" className="reg-input" />
                            </div>
                            <div className="reg-input-group" style={{ flex: 1 }}>
                              <label className="reg-label" htmlFor="cedula">Cédula de Identidad</label>
                              <input type="text" id="cedula" name="cedula" autoComplete="off" value={cedula} onChange={(e) => setCedula(formatearCedula(e.target.value))} required placeholder="000-000000-0000X" maxLength={16} className="reg-input reg-input-mono" />
                            </div>
                          </div>
                        )}

                        {(tab === "institucional" || tab === "tecnico") && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="reg-input-group"
                          >
                            <label className="reg-label" htmlFor="codigoInvitacion">Código de {tab === "tecnico" ? "Acceso" : "Invitación"}</label>
                            <input type="text" id="codigoInvitacion" name="codigoInvitacion" autoComplete="off" value={codigoInvitacion} onChange={(e) => setCodigoInvitacion(e.target.value.toUpperCase())} required placeholder="Ej. ENACAL-2026" className="reg-input reg-input-code" />
                            <span className="reg-hint">
                              {tab === "tecnico" ? "Solicita este código a tu líder de cuadrilla." : "Código oficial asignado por el sistema."}
                            </span>
                          </motion.div>
                        )}

                        {tab === "institucional" && (
                          <div className="reg-row">
                            <div className="reg-input-group" style={{ flex: 1 }}>
                              <label className="reg-label" htmlFor="nombreCompleto">Nombre Completo</label>
                              <input type="text" id="nombreCompleto" name="nombreCompleto" autoComplete="name" value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)} required placeholder="Ej. María López" className="reg-input" />
                            </div>
                            <div className="reg-input-group" style={{ flex: 1 }}>
                              <label className="reg-label" htmlFor="cedula">Cédula de Identidad</label>
                              <input type="text" id="cedula" name="cedula" autoComplete="off" value={cedula} onChange={(e) => setCedula(formatearCedula(e.target.value))} required placeholder="000-000000-0000X" maxLength={16} className="reg-input reg-input-mono" />
                            </div>
                          </div>
                        )}

                        <div className="reg-input-group">
                          <label className="reg-label" htmlFor="email">Correo Electrónico</label>
                          <input type="email" id="email" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="nombre@ejemplo.com" className="reg-input" />
                        </div>

                        <div className="reg-row">
                          <div className="reg-input-group" style={{ flex: 1 }}>
                            <label className="reg-label" htmlFor="password">Contraseña</label>
                            <input type="password" id="password" name="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Segura (>6 car.)" className="reg-input" />
                          </div>
                          <div className="reg-input-group" style={{ flex: 1 }}>
                            <label className="reg-label" htmlFor="confirmarPassword">Confirmar</label>
                            <input type="password" id="confirmarPassword" name="confirmarPassword" autoComplete="new-password" value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)} required placeholder="Repetir" className="reg-input" />
                          </div>
                        </div>

                        {error && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="sif-error">
                            ⚠️ {error}
                          </motion.div>
                        )}

                        <div className="reg-form-actions">
                          <button type="submit" disabled={enviando} className="reg-submit-btn">
                            {enviando ? "Procesando..." : tab === "ciudadano" ? "Crear Cuenta Ciudadana" : "Registrar Perfil"}
                          </button>
                          <button type="button" onClick={alIrLogin} className="reg-login-link">
                            ¿Ya tienes cuenta? <span className="reg-login-accent">Inicia sesión</span>
                          </button>
                        </div>
                      </div>

                      {tab !== "institucional" && (
                        <div className="reg-form-col reg-form-col--bio">
                          <BiometricIdentitySection
                            light
                            onSelfieCapture={manejarCapturaSelfie}
                            selfieDone={selfieCapturada}
                            frenteInputRef={frenteInputRef}
                            atrasInputRef={atrasInputRef}
                            cedulaFrenteUrl={cedulaFrenteUrl}
                            cedulaAtrasUrl={cedulaAtrasUrl}
                            onCedulaFrente={manejarCedulaFrente}
                            onCedulaAtras={manejarCedulaAtras}
                            disabled={validandoIdentidad || enviando}
                          />
                        </div>
                      )}
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: REG_STYLES }} />
    </div>
  );
}

const REG_STYLES = `
  .sif-root {
    display: flex;
    width: 100%;
    flex-direction: column;
    height: 100vh;
    min-height: 100vh;
    max-height: 100vh;
    overflow: hidden;
    background: #f7f5f2;
    position: relative;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    --cr-maroon: #7A1835;
    --cr-maroon-dark: #5C1228;
    --cr-maroon-light: #9B2347;
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
    background:
      linear-gradient(160deg, #fafafa 0%, #f3f1ee 45%, #ece8e4 100%);
  }

  .sif-bg-dots {
    position: absolute;
    inset: 0;
    opacity: 0.45;
    background-image: radial-gradient(circle, rgba(122, 24, 53, 0.07) 1px, transparent 1px);
    background-size: 28px 28px;
    mask-image: radial-gradient(ellipse 85% 75% at 50% 40%, black 15%, transparent 100%);
  }

  .sif-content {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    flex: 1;
    height: 100vh;
    overflow: hidden;
  }

  .sif-navbar {
    position: fixed;
    top: 16px;
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
    box-shadow: 0 4px 24px rgba(122, 24, 53, 0.07), inset 0 1px 0 rgba(255,255,255,0.9);
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
    text-decoration: none;
    flex-shrink: 0;
  }

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
    box-shadow: 0 6px 18px rgba(122, 24, 53, 0.32);
  }

  .sif-form-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;
    padding: 72px 1.25rem 1rem;
    overflow: hidden;
    box-sizing: border-box;
  }

  .sif-step-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    text-align: center;
    width: 100%;
    max-height: 100%;
    overflow: hidden;
  }

  .sif-step-header { display: flex; flex-direction: column; gap: 2px; }

  .sif-title {
    font-size: 1.5rem;
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--cr-ink);
    margin: 0;
  }

  .sif-subtitle {
    font-size: 0.82rem;
    color: var(--cr-muted);
    font-weight: 500;
    margin: 0;
  }

  .sif-error {
    background: rgba(239, 68, 68, 0.08);
    border: 1px solid rgba(239, 68, 68, 0.22);
    color: #b91c1c;
    padding: 10px 12px;
    border-radius: 10px;
    font-size: 12px;
    text-align: center;
  }

  .sif-success-icon-wrap {
    padding: 32px 0;
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

  .reg-form-container {
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
    padding: 1.25rem 1.75rem;
    height: auto;
    max-height: calc(100vh - 72px);
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    overflow-y: auto;
    background: rgba(255, 255, 255, 0.94);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(122, 24, 53, 0.1);
    border-radius: 20px;
    box-shadow:
      0 20px 56px rgba(122, 24, 53, 0.07),
      0 1px 0 rgba(255,255,255,0.9) inset;
  }

  .reg-page-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin-bottom: 4px;
  }

  .reg-page-header__brand {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  @media (min-width: 900px) {
    .reg-page-header {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      text-align: left;
      gap: 1.5rem;
    }
    .reg-page-header__brand {
      align-items: flex-start;
      text-align: left;
    }
    .reg-tabs { flex-shrink: 0; max-width: 380px; }
  }

  .reg-header-logo { filter: drop-shadow(0 2px 6px rgba(122, 24, 53, 0.08)); }

  .reg-tabs {
    display: flex;
    gap: 4px;
    background: #f1eeeb;
    padding: 4px;
    border-radius: 14px;
    border: 1px solid rgba(122, 24, 53, 0.08);
    width: 100%;
  }

  .reg-tab {
    flex: 1;
    padding: 7px 6px;
    border: none;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s ease;
    background: transparent;
    color: var(--cr-muted);
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 5px;
  }

  .reg-tab-active {
    background: #fff;
    color: var(--cr-maroon);
    box-shadow: 0 2px 10px rgba(122, 24, 53, 0.1);
    border: 1px solid rgba(122, 24, 53, 0.12);
  }

  .reg-tab-icon { font-size: 14px; }
  .reg-tab-label { display: block; }

  .reg-form {
    display: flex;
    flex-direction: column;
    gap: 0;
    text-align: left;
    flex: 1;
    min-height: 0;
  }

  .reg-form-layout {
    display: grid;
    grid-template-columns: minmax(260px, 1fr) minmax(340px, 1.2fr);
    gap: 1rem;
    align-items: stretch;
    flex: 1;
    min-height: 0;
  }

  .reg-form--single .reg-form-layout {
    grid-template-columns: minmax(280px, 480px);
    justify-content: center;
    margin: 0 auto;
    width: 100%;
  }

  .reg-form-col {
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 0;
  }

  .reg-form-col--bio { min-height: 0; overflow: hidden; }
  .reg-form-col--fields { justify-content: center; }

  .reg-form-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 2px;
  }

  .reg-form-actions .reg-submit-btn {
    flex: 1;
    margin-top: 0;
    padding: 11px 16px;
    font-size: 13px;
  }

  .reg-form-actions .reg-login-link {
    flex-shrink: 0;
    font-size: 12px;
    white-space: nowrap;
  }

  @media (max-width: 899px) {
    .sif-root { height: auto; max-height: none; overflow: auto; }
    .sif-content { height: auto; overflow: visible; }
    .sif-form-area { height: auto; overflow: visible; padding: 88px 1rem 2rem; }
    .sif-step-content { overflow: visible; max-height: none; }
    .reg-form-container { padding: 1rem; border-radius: 16px; }
    .reg-form-layout { grid-template-columns: 1fr; }
    .reg-form-actions { flex-direction: column; align-items: stretch; }
    .reg-form-actions .reg-login-link { text-align: center; white-space: normal; }
  }

  .reg-input-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .reg-label {
    font-size: 11px;
    color: #334155;
    font-weight: 600;
    margin-left: 4px;
    letter-spacing: 0.02em;
  }

  .reg-input {
    width: 100%;
    padding: 9px 12px;
    background: #fff;
    border: 1px solid rgba(122, 24, 53, 0.14);
    border-radius: 10px;
    color: var(--cr-ink);
    font-size: 13px;
    outline: none;
    transition: all 0.2s ease;
    box-sizing: border-box;
  }
  .reg-input:focus {
    border-color: rgba(122, 24, 53, 0.45);
    box-shadow: 0 0 0 3px rgba(122, 24, 53, 0.08);
  }
  .reg-input::placeholder { color: #94a3b8; }

  .reg-input-mono { font-family: monospace; letter-spacing: 1px; }

  .reg-input-code {
    background: rgba(122, 24, 53, 0.04);
    border-color: rgba(122, 24, 53, 0.25);
    color: var(--cr-maroon);
    font-weight: bold;
    letter-spacing: 1px;
  }

  .reg-hint { font-size: 11px; color: var(--cr-muted); margin-left: 4px; }

  .reg-row { display: flex; gap: 10px; }

  .reg-submit-btn {
    width: 100%;
    margin-top: 8px;
    padding: 11px;
    border-radius: 9999px;
    border: none;
    background: linear-gradient(135deg, var(--cr-maroon) 0%, var(--cr-maroon-dark) 100%);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.02em;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 6px 20px rgba(122, 24, 53, 0.28);
  }
  .reg-submit-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 28px rgba(122, 24, 53, 0.35);
    filter: brightness(1.05);
  }
  .reg-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .reg-login-link {
    background: none;
    border: none;
    color: var(--cr-muted);
    font-size: 12px;
    cursor: pointer;
    transition: color 0.2s;
    padding: 0;
  }
  .reg-login-link:hover { color: var(--cr-maroon); }

  .reg-login-accent {
    color: var(--cr-maroon);
    font-weight: 700;
  }

  @media (max-height: 740px) and (min-width: 900px) {
    .sif-form-area { padding-top: 60px; padding-bottom: 0.5rem; }
    .reg-form-layout { gap: 0.75rem; }
    .reg-form-col { gap: 8px; }
    .bio-section--compact { padding: 0.5rem 0.65rem; }
  }
`;
