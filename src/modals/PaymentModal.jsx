import { useState } from "react";
import { procesarPagoSimulado } from "../services/pagosService";
import { FlippableCreditCard } from "../Components/ui/credit-debit-card";

/**
 * H016 — Modal de Pago Simulado
 * Formulario elegante con tarjeta mock. Sin cobro real.
 */
export default function PaymentModal({ abierto, denuncia, alCerrar, alExito }) {
  const [tarjeta, setTarjeta] = useState("");
  const [expiracion, setExpiracion] = useState("");
  const [cvv, setCvv] = useState("");
  const [cvvFocus, setCvvFocus] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState("");
  const [completado, setCompletado] = useState(false);

  if (!abierto || !denuncia) return null;

  const MONTO = 150.00; // C$150 NIO

  const formatearTarjeta = (v) => {
    const nums = v.replace(/\D/g, "").slice(0, 16);
    return nums.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatearExp = (v) => {
    const nums = v.replace(/\D/g, "").slice(0, 4);
    if (nums.length <= 2) return nums;
    return `${nums.slice(0, 2)}/${nums.slice(2)}`;
  };

  const manejarPago = async (e) => {
    e.preventDefault();
    setError("");
    setCvvFocus(false);

    const numLimpio = tarjeta.replace(/\s/g, "");
    if (numLimpio.length < 16) return setError("Número de tarjeta incompleto.");
    if (expiracion.length < 5) return setError("Fecha de vencimiento inválida.");
    if (cvv.length < 3) return setError("CVV inválido.");

    setProcesando(true);
    try {
      await procesarPagoSimulado({
        denunciaId: denuncia.id,
        monto: MONTO,
        metodoPago: `**** ${numLimpio.slice(-4)}`,
      });
      setCompletado(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  };

  const cerrar = () => {
    const fueCompletado = completado;
    setTarjeta(""); setExpiracion(""); setCvv("");
    setError(""); setCompletado(false);
    if (fueCompletado) {
      alExito?.();
    } else {
      alCerrar();
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid #cbd5e1',
    fontSize: '0.95rem',
    fontWeight: '600',
    color: '#1e293b',
    outline: 'none',
    background: '#f8fafc',
    transition: 'all 0.2s'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: '800',
    color: '#64748b',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  return (
    <div className="modal-backdrop" onClick={cerrar} style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ 
        maxWidth: '440px', 
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        padding: '32px'
      }}>
        {/* Inyectar animaciones de éxito */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes modalSuccessBounce {
            0% { transform: scale(0.3); opacity: 0; }
            50% { transform: scale(1.15); }
            70% { transform: scale(0.92); }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes modalSuccessFadeIn {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem', fontWeight: '800' }}>
            ⭐ Destacar Reporte
          </h3>
          <button onClick={cerrar} style={{ 
            background: '#f1f5f9', border: 'none', width: '32px', height: '32px', 
            borderRadius: '50%', color: '#64748b', cursor: 'pointer', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold',
            transition: 'all 0.2s'
          }} onMouseOver={(e) => e.currentTarget.style.background = '#e2e8f0'} onMouseOut={(e) => e.currentTarget.style.background = '#f1f5f9'}>
            ✕
          </button>
        </div>

        {completado ? (
          <div style={{ textAlign: 'center', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ 
              width: '76px', 
              height: '76px', 
              borderRadius: '50%', 
              background: '#ecfdf5', 
              border: '2.5px solid #10b981', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: '34px',
              color: '#10b981',
              margin: '0 auto',
              fontWeight: 'bold',
              boxShadow: '0 10px 20px rgba(16, 185, 129, 0.15)',
              animation: 'modalSuccessBounce 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}>
              ✓
            </div>
            <div style={{ animation: 'modalSuccessFadeIn 0.4s ease 0.05s both' }}>
              <h3 style={{ color: '#059669', margin: '0 0 6px', fontSize: '1.45rem', fontWeight: '850' }}>¡Pago Exitoso!</h3>
              <p style={{ color: '#64748b', fontSize: '0.92rem', margin: 0, fontWeight: '500' }}>El destaque del reporte se ha registrado correctamente.</p>
            </div>
            <div style={{ 
              background: '#f8fafc', 
              padding: '16px', 
              borderRadius: '16px', 
              border: '1px solid #e2e8f0',
              margin: '4px 0',
              textAlign: 'left',
              animation: 'modalSuccessFadeIn 0.4s ease 0.12s both'
            }}>
              <p style={{ color: '#475569', fontSize: '0.88rem', margin: 0, lineHeight: 1.55 }}>
                Tu reporte <strong style={{ color: '#0f172a' }}>"{denuncia.titulo}"</strong> será destacado por <strong style={{ color: 'var(--primary)' }}>7 días</strong> en las carteleras prioritarias de la comunidad.
              </p>
            </div>
            <button 
              onClick={cerrar}
              style={{ 
                background: 'linear-gradient(135deg, var(--primary) 0%, #8c1c3c 100%)',
                color: '#fff', 
                border: 'none', 
                padding: '14px 28px', 
                borderRadius: '30px', 
                fontWeight: '800', 
                fontSize: '0.9rem', 
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                cursor: 'pointer', 
                marginTop: '10px',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 14px rgba(122, 24, 53, 0.3)',
                animation: 'modalSuccessFadeIn 0.4s ease 0.2s both'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(122, 24, 53, 0.4)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(122, 24, 53, 0.3)';
              }}
            >
              Entendido
            </button>
          </div>
        ) : (
          <form onSubmit={manejarPago} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <FlippableCreditCard 
              cardNumber={tarjeta}
              expiryDate={expiracion}
              cvv={cvv}
              cardholderName="CIUDADANO EJEMPLO"
              isFlipped={cvvFocus}
            />

            <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', margin: '-4px 0 4px', lineHeight: 1.4 }}>
              Destacar: <strong style={{ color: '#1e293b' }}>{denuncia.titulo}</strong> <br/> Monto: <strong style={{ color: 'var(--primary)' }}>C$ {MONTO.toFixed(2)}</strong>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={labelStyle}>Número de tarjeta</label>
              <input 
                name="cardNumber" 
                value={tarjeta} 
                onChange={(e) => setTarjeta(formatearTarjeta(e.target.value))}
                placeholder="1234 5678 9012 3456" 
                maxLength={19} 
                required 
                autoComplete="cc-number" 
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; setCvvFocus(false); }}
                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={labelStyle}>Vencimiento</label>
                <input 
                  name="expiry" 
                  value={expiracion} 
                  onChange={(e) => setExpiracion(formatearExp(e.target.value))}
                  placeholder="MM/AA" 
                  maxLength={5} 
                  required 
                  autoComplete="cc-exp" 
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; setCvvFocus(false); }}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={labelStyle}>CVV</label>
                <input 
                  name="cvv" 
                  type="password" 
                  value={cvv} 
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  onFocus={() => setCvvFocus(true)} 
                  placeholder="•••" 
                  maxLength={4} 
                  required 
                  autoComplete="cc-csc" 
                  style={inputStyle}
                />
              </div>
            </div>

            {error && (
              <div style={{ 
                background: '#fef2f2', 
                border: '1px solid #fecaca', 
                color: '#ef4444', 
                padding: '10px 14px', 
                borderRadius: '10px', 
                fontSize: '0.85rem', 
                fontWeight: '600', 
                textAlign: 'center' 
              }}>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={procesando} 
              style={{ 
                marginTop: '6px',
                background: 'linear-gradient(135deg, var(--primary) 0%, #991f42 100%)',
                color: '#fff', 
                border: 'none', 
                padding: '14px', 
                borderRadius: '12px', 
                fontWeight: '800', 
                fontSize: '0.95rem', 
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 6px 20px var(--primary-glow)'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              {procesando ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <span className="loader-spinner" style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></span>
                  Procesando pago...
                </span>
              ) : `Pagar C$ ${MONTO.toFixed(2)}`}
            </button>

            <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', margin: 0 }}>
              🔒 Pago simulado — No se realizará ningún cobro real
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
