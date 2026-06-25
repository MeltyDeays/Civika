import { useState } from "react";

const inputStyle = {
  width: '100%',
  padding: '14px 16px',
  background: 'rgba(15, 23, 42, 0.4)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  color: '#ffffff',
  fontSize: '15px',
  outline: 'none',
  transition: 'all 0.2s ease',
  boxSizing: 'border-box',
  fontFamily: 'monospace',
  letterSpacing: '2px',
  textAlign: 'center',
  textTransform: 'uppercase',
};

export default function VinculacionTecnicoModal({ abierto, alCerrar, alVincular }) {
  const [codigo, setCodigo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  if (!abierto) return null;

  const manejarVincular = async () => {
    const val = codigo.trim().toUpperCase();
    if (!val) {
      setError("Ingresa un código de invitación.");
      return;
    }
    setEnviando(true);
    setError("");
    try {
      await alVincular(val);
      setExito(true);
      setTimeout(() => window.location.reload(), 1800);
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  };

  const cerrar = () => {
    if (exito) return;
    setCodigo("");
    setError("");
    setExito(false);
    alCerrar();
  };

  return (
    <div
      onClick={cerrar}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: '2rem',
        animation: 'fadeIn 0.3s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%', maxWidth: '440px',
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '40px 32px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          animation: 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <button onClick={cerrar} style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'rgba(255,255,255,0.08)', border: 'none',
          color: '#94a3b8', width: '32px', height: '32px',
          borderRadius: '10px', cursor: 'pointer', fontSize: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}
        onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}
        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#94a3b8'; }}
        >✕</button>

        <header style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛠️</div>
          <h2 style={{ margin: 0, fontSize: '22px', color: '#ffffff', fontWeight: '800', letterSpacing: '-0.5px' }}>
            Ascender a Técnico
          </h2>
          <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: '14px', lineHeight: 1.5 }}>
            Ingresa el código de invitación proporcionado por tu entidad para vincular tu cuenta como técnico de campo.
          </p>
        </header>

        {exito ? (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '16px', padding: '24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
            <h3 style={{ margin: 0, color: '#6ee7b7', fontSize: '18px', fontWeight: '700' }}>¡Vinculación Exitosa!</h3>
            <p style={{ margin: '8px 0 0', color: '#94a3b8', fontSize: '14px' }}>
              Tu cuenta ha sido ascendida a Técnico. Recargando sesión...
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: '#cbd5e1', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Código de Invitación
              </label>
              <input
                type="text"
                value={codigo}
                onChange={(e) => { setCodigo(e.target.value.toUpperCase()); setError(""); }}
                placeholder="EJ: ENACAL-2026"
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(59,130,246,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                autoFocus
              />
              <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                Solicita este código al administrador de tu entidad.
              </span>
            </div>

            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#fca5a5', padding: '12px 16px', borderRadius: '12px',
                fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
                marginBottom: '20px',
              }}>
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              onClick={manejarVincular}
              disabled={enviando || !codigo.trim()}
              style={{
                width: '100%', padding: '16px', borderRadius: '14px', border: 'none',
                background: enviando || !codigo.trim() ? '#475569' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
                color: 'white', fontSize: '16px', fontWeight: '700',
                cursor: enviando || !codigo.trim() ? 'not-allowed' : 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: enviando || !codigo.trim() ? 'none' : '0 10px 20px -10px rgba(59, 130, 246, 0.5)',
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
              }}
              onMouseOver={(e) => !enviando && codigo.trim() && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {enviando ? "Vinculando..." : "🔗 Vincular como Técnico"}
            </button>

            <div style={{
              marginTop: '20px', padding: '14px', borderRadius: '12px',
              background: 'rgba(59, 130, 246, 0.06)',
              border: '1px solid rgba(59, 130, 246, 0.1)',
            }}>
              <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                <span style={{ fontSize: '16px', flexShrink: 0 }}>ℹ️</span>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px', lineHeight: 1.6 }}>
                  Al vincular tu cuenta, tu rol cambiará de <strong style={{ color: '#60a5fa' }}>Ciudadano</strong> a <strong style={{ color: '#60a5fa' }}>Técnico</strong>. 
                  Mantendrás acceso a tus reportes y además podrás gestionar tareas asignadas.
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </div>
  );
}
