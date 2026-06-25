import React from "react";

export default function PantallaBloqueo({ perfil, bloqueoData, alCerrarSesion }) {
  const esBaneo = perfil?.estado_cuenta === "baneado";
  const { multa, strike } = bloqueoData || {};

  return (
    <div style={{
      position: 'fixed', inset: 0, 
      background: 'radial-gradient(circle at top, #1e293b, #0f172a)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999,
      padding: '1.5rem', overflowY: 'auto'
    }}>
      <div style={{
        background: '#ffffff', borderRadius: '32px', maxWidth: '600px', width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', padding: '2.5rem',
        display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid rgba(255,255,255,0.1)'
      }}>
        {/* Encabezado */}
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '4rem', display: 'block', marginBottom: '0.5rem' }}>
            {esBaneo ? "💀" : "🚨"}
          </span>
          <h1 style={{ margin: 0, color: esBaneo ? '#ef4444' : '#f59e0b', fontSize: '1.8rem', fontWeight: '900' }}>
            {esBaneo ? "Cuenta Baneada Permanentemente" : "Acceso Suspendido Temporalmente"}
          </h1>
          <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5 }}>
            {esBaneo 
              ? "Has alcanzado el límite máximo de strikes permitidos (12 o más) por uso malicioso de la aplicación. Tu cuenta ha sido bloqueada permanentemente."
              : "Tu cuenta ha sido suspendida temporalmente debido al reporte verificado de denuncias falsas."
            }
          </p>
        </div>

        {/* Detalle de Strike Causante */}
        {!esBaneo && strike && (
          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ⚠️ Detalle de la Infracción Reciente
            </h3>
            <p style={{ margin: '0 0 6px', fontSize: '0.9rem', color: '#334155' }}>
              <strong>Denuncia:</strong> "{strike.denuncia?.titulo || "Reporte Ciudadano"}"
            </p>
            <p style={{ margin: '0 0 6px', fontSize: '0.9rem', color: '#334155' }}>
              <strong>Entidad que reportó la falsedad:</strong> {strike.entidad?.nombre}
            </p>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#ef4444', fontStyle: 'italic', lineHeight: 1.4 }}>
              <strong>Motivo de sanción:</strong> "{strike.motivo}"
            </p>
          </div>
        )}

        {/* Ticket de Multa */}
        {!esBaneo && multa && (
          <div style={{
            background: 'linear-gradient(135deg, #fafafa, #f1f5f9)',
            border: '2px dashed #cbd5e1', borderRadius: '24px', padding: '1.5rem',
            position: 'relative', display: 'flex', flexDirection: 'column', gap: '1rem'
          }}>
            {/* Círculos laterales simulando ticket */}
            <div style={{ position: 'absolute', left: '-12px', top: '50%', transform: 'translateY(-50%)', width: '24px', height: '24px', borderRadius: '50%', background: '#1e293b' }} />
            <div style={{ position: 'absolute', right: '-12px', top: '50%', transform: 'translateY(-50%)', width: '24px', height: '24px', borderRadius: '50%', background: '#1e293b' }} />
            
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' }}>
                Ticket de Multa por Falso Reporte
              </span>
              <h2 style={{ margin: '4px 0 0', color: '#0f172a', fontSize: '1.75rem', fontWeight: '900' }}>
                C$ {multa.monto}.00
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: '600' }}>
                Nivel de Multa: {multa.nivel} / 4
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ display: 'block', color: '#64748b', fontWeight: '600' }}>Pagar en oficinas de:</span>
                <span style={{ fontWeight: '700', color: '#334155' }}>{multa.entidad?.nombre}</span>
              </div>
              <div>
                <span style={{ display: 'block', color: '#64748b', fontWeight: '600' }}>Dirección de pago:</span>
                <span style={{ fontWeight: '700', color: '#334155' }}>{multa.entidad?.direccion || "Oficinas Centrales"}</span>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ display: 'block', color: '#64748b', fontWeight: '600' }}>Identificador del Ticket:</span>
                <span style={{ fontWeight: '700', color: '#334155', fontFamily: 'monospace' }}>{multa.id}</span>
              </div>
            </div>

            {/* Código de barra simulado */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '0.5rem' }}>
              <div style={{ height: '40px', background: 'repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 8px, #000 8px, #000 12px)', width: '220px', borderRadius: '4px' }} />
              <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', fontFamily: 'monospace' }}>* CIVIC-{multa.id.substring(0,8).toUpperCase()} *</span>
            </div>
          </div>
        )}

        {/* Sección de Apelación */}
        <div style={{ background: '#eff6ff', padding: '1.25rem', borderRadius: '20px', border: '1px solid #bfdbfe' }}>
          <h4 style={{ margin: '0 0 4px', fontSize: '0.85rem', fontWeight: '800', color: '#1e40af', textTransform: 'uppercase' }}>
            ℹ️ ¿Cómo apelar o resolver esto?
          </h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#1e3a8a', lineHeight: 1.5 }}>
            {esBaneo 
              ? "Los baneos permanentes requieren apelación directa con el Super Administrador presentando justificación jurídica y pruebas físicas extraordinarias."
              : `Debes presentarte en las oficinas físicas de ${multa?.entidad?.nombre || "la entidad"} indicadas arriba con este ticket. Puedes apelar si llevas pruebas físicas fehacientes (fotografías con metadatos de GPS, coordenadas, testigos) para desmentir la falsedad. De lo contrario, realiza el pago de la multa correspondiente. Una vez la institución registre el pago o resuelva la apelación, tu cuenta se reactivará automáticamente.`
            }
          </p>
        </div>

        {/* Botón de Salir */}
        <button
          onClick={alCerrarSesion}
          style={{
            background: '#1e293b', color: '#fff', border: 'none',
            padding: '12px', borderRadius: '12px', fontWeight: '700',
            cursor: 'pointer', transition: 'background 0.2s', fontSize: '0.95rem'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0f172a'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1e293b'}
        >
          🚪 Cerrar Sesión y Salir
        </button>
      </div>
    </div>
  );
}
