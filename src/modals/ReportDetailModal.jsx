import { useEffect, useState, useCallback } from "react";
import { formatearFecha, parsearPuntoGeo } from "../utils/formatters";
import { firmarReporte, retirarFirma, verificarFirma, contarFirmas } from "../services/firmasService";

export default function ModalDetalleReporte({ reporte, alCerrar, alEditar, alEliminar, alCambiarFirma, alPagar, usuarioId, soloLectura }) {
  const [yaFirmo, setYaFirmo] = useState(false);
  const [totalFirmas, setTotalFirmas] = useState(0);
  const [procesando, setProcesando] = useState(false);
  const [confirmandoEliminacion, setConfirmandoEliminacion] = useState(false);

  const cargarEstadoFirma = useCallback(async () => {
    if (!reporte?.id) return;
    try {
      const [firmado, total] = await Promise.all([
        verificarFirma(reporte.id),
        contarFirmas(reporte.id)
      ]);
      setYaFirmo(firmado);
      setTotalFirmas(total);
    } catch {
      setTotalFirmas(reporte.firmas || 0);
    }
  }, [reporte?.id, reporte?.firmas]);

  useEffect(() => {
    cargarEstadoFirma();
  }, [cargarEstadoFirma]);

  if (!reporte) return null;

  const toggleFirma = async () => {
    setProcesando(true);
    try {
      if (yaFirmo) {
        await retirarFirma(reporte.id);
        setYaFirmo(false);
        const nuevas = Math.max(0, totalFirmas - 1);
        setTotalFirmas(nuevas);
        alCambiarFirma?.(reporte.id, nuevas);
      } else {
        await firmarReporte(reporte.id);
        setYaFirmo(true);
        const nuevas = totalFirmas + 1;
        setTotalFirmas(nuevas);
        alCambiarFirma?.(reporte.id, nuevas);
      }
    } catch (e) {
      console.error("Error toggling firma:", e.message);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={alCerrar} style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(15, 23, 42, 0.6)' }}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()} style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        padding: '32px',
        maxWidth: '600px',
        width: '90%',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <span style={{ background: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
                {reporte.categoria}
              </span>
              <span style={{ 
                background: reporte.urgencia === 'critica' ? '#fee2e2' : '#fef3c7', 
                color: reporte.urgencia === 'critica' ? '#ef4444' : '#d97706',
                padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase'
              }}>
                {reporte.urgencia}
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#0f172a', lineHeight: 1.2 }}>{reporte.titulo}</h3>
          </div>
          <button onClick={alCerrar} style={{ 
            background: '#f1f5f9', border: 'none', width: '36px', height: '36px', 
            borderRadius: '50%', color: '#64748b', cursor: 'pointer', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', fontSize: '18px', transition: 'all 0.2s'
          }} onMouseOver={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }} onMouseOut={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}>
            ✕
          </button>
        </div>
        <div className="modal-body-scrollable" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingRight: '4px' }}>
          {reporte.url_imagen ? (
            <div style={{ width: '100%', height: '240px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <img src={reporte.url_imagen} alt={reporte.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : null}
          <div style={{ color: '#475569', fontSize: '15px', lineHeight: 1.6, background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <p style={{ margin: 0 }}>{reporte.descripcion}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#fff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Estado</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#334155' }}>{reporte.estado}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Fecha</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>{formatearFecha(reporte.creado_el)}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Ubicación</span>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#334155' }}>
                {reporte.municipio || reporte.departamento ? `${reporte.municipio || ""}, ${reporte.departamento || ""}` : "No especificada"}
              </span>
              {reporte.direccion && (
                <span style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px', lineHeight: 1.4 }}>
                  📍 {reporte.direccion}
                </span>
              )}
            </div>
          </div>

          {(() => {
            const geo = reporte.lat && reporte.lng ? { lat: reporte.lat, lng: reporte.lng } : parsearPuntoGeo(reporte.ubicacion);
            if (!geo) {
              return (
                <div style={{ 
                  padding: '24px 16px', borderRadius: '16px', background: '#f8fafc', 
                  border: '1px dashed #cbd5e1', textAlign: 'center', color: '#64748b' 
                }}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🗺️</div>
                  <strong style={{ fontSize: '14px', display: 'block', color: '#475569' }}>Sin coordenadas geográficas</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.8 }}>Este reporte no cuenta con datos de geolocalización exactos.</p>
                </div>
              );
            }
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', height: '200px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                  <iframe
                    title="Ubicación"
                    width="100%" height="100%" frameBorder="0" style={{ border: 0 }}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${geo.lng-0.005},${geo.lat-0.003},${geo.lng+0.005},${geo.lat+0.003}&layer=mapnik&marker=${geo.lat},${geo.lng}`}
                  />
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${geo.lat},${geo.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px 18px',
                    borderRadius: '12px',
                    background: '#1a73e8',
                    color: '#ffffff',
                    textDecoration: 'none',
                    fontWeight: '750',
                    fontSize: '0.88rem',
                    boxShadow: '0 4px 12px rgba(26, 115, 232, 0.22)',
                    transition: 'all 0.2s ease',
                    textAlign: 'center'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#155cb4';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = '#1a73e8';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  🚗 Cómo llegar (Google Maps)
                </a>
              </div>
            );
          })()}

          {/* H026: Mostrar comentario de cierre si existe */}
          {(reporte.estado === "completado" || reporte.estado === "rechazado") && reporte.comentario_cierre && (
            <div style={{
              marginTop: '16px', padding: '16px', borderRadius: '12px',
              background: reporte.estado === "completado" ? "#f0fdf4" : "#fef2f2",
              border: `1px solid ${reporte.estado === "completado" ? "#bbf7d0" : "#fecaca"}`,
              color: '#334155'
            }}>
              <strong style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: reporte.estado === "completado" ? "#16a34a" : "#dc2626" }}>
                {reporte.estado === "completado" ? "✅ Resolución del Técnico:" : "🚫 Razón del Rechazo:"}
              </strong>
              <p style={{ margin: 0, fontSize: '14px', fontStyle: 'italic', lineHeight: 1.5 }}>
                "{reporte.comentario_cierre}"
              </p>
            </div>
          )}

          {!soloLectura && <>
            {/* ─── Botón de Firma Funcional (H011 + H014) ─── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              margin: '8px 0', padding: '20px',
              background: yaFirmo ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.04) 100%)' : 'linear-gradient(135deg, #fff 0%, #f8fafc 100%)',
              borderRadius: '16px', border: `1px solid ${yaFirmo ? 'rgba(16, 185, 129, 0.25)' : '#e2e8f0'}`,
              boxShadow: yaFirmo ? '0 10px 15px -3px rgba(16, 185, 129, 0.1)' : '0 4px 6px -1px rgba(0,0,0,0.02)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              <div>
                <div style={{ fontSize: '14px', color: '#64748b', fontWeight: '600', marginBottom: '4px' }}>
                  Apoyo Ciudadano
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '32px', fontWeight: '900', color: yaFirmo ? '#059669' : '#0f172a', lineHeight: 1 }}>
                    {totalFirmas}
                  </span>
                  <span style={{ fontSize: '15px', color: yaFirmo ? '#10b981' : '#64748b', fontWeight: '600' }}>
                    {totalFirmas === 1 ? 'firma' : 'firmas'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                disabled={procesando}
                onClick={toggleFirma}
                style={{
                  background: yaFirmo ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'linear-gradient(135deg, var(--primary) 0%, #8c1c3c 100%)',
                  color: '#fff', 
                  border: yaFirmo ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(194, 159, 104, 0.4)', 
                  borderRadius: '30px',
                  padding: '12px 24px', 
                  fontSize: '14px', 
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  cursor: procesando ? 'wait' : 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  opacity: procesando ? 0.7 : 1,
                  boxShadow: yaFirmo ? '0 6px 20px rgba(5, 150, 105, 0.25)' : '0 6px 20px rgba(122, 24, 53, 0.3)',
                  transform: procesando ? 'scale(0.98)' : 'scale(1)'
                }}
                onMouseOver={(e) => !procesando && (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseOut={(e) => !procesando && (e.currentTarget.style.transform = 'translateY(0)')}
                onMouseDown={(e) => !procesando && (e.currentTarget.style.transform = 'scale(0.95)')}
                onMouseUp={(e) => !procesando && (e.currentTarget.style.transform = 'translateY(-2px)')}
              >
                {procesando ? (
                  <span style={{ display: 'inline-block', width: '20px', height: '20px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                ) : yaFirmo ? '✓ Ya lo firmaste' : '✍️ Firmar Apoyo'}
              </button>
            </div>
          </>}
        </div>

        {usuarioId && reporte.id_ciudadano === usuarioId && (
          <div className="modal-actions" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
            {confirmandoEliminacion ? (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fee2e2',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                width: '100%',
                boxShadow: '0 4px 6px -1px rgba(220,38,38,0.05)'
              }}>
                <p style={{ margin: 0, color: '#991b1b', fontSize: '0.9rem', fontWeight: '800', textAlign: 'center' }}>
                  ⚠️ ¿Estás seguro de que deseas eliminar este reporte permanentemente? Esta acción no se puede deshacer.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => setConfirmandoEliminacion(false)} 
                    style={{ 
                      flex: 1, 
                      padding: '12px', 
                      borderRadius: '12px', 
                      border: '1px solid #cbd5e1', 
                      background: '#fff', 
                      color: '#475569', 
                      fontWeight: '700', 
                      fontSize: '0.85rem', 
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={async () => {
                      await alEliminar?.(reporte);
                      setConfirmandoEliminacion(false);
                    }} 
                    style={{ 
                      flex: 1, 
                      padding: '12px', 
                      borderRadius: '12px', 
                      border: 'none', 
                      background: '#ef4444', 
                      color: '#fff', 
                      fontWeight: '800', 
                      fontSize: '0.85rem', 
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#dc2626'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#ef4444'}
                  >
                    Sí, Eliminar
                  </button>
                </div>
              </div>
            ) : (
              <>
                {!reporte.es_destacado && (
                  <button 
                    type="button" 
                    onClick={() => alPagar?.(reporte)}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px', 
                      padding: '12px 20px', fontWeight: '800', fontSize: '14px', 
                      background: 'linear-gradient(135deg, #c29f68 0%, #a17f4b 100%)', 
                      color: '#fff', border: 'none', cursor: 'pointer', 
                      boxShadow: '0 4px 12px rgba(194, 159, 104, 0.3)', width: '100%', justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    ⭐ Destacar Reporte
                  </button>
                )}
                {reporte.estado === 'pendiente' && (
                  <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                    <button 
                      className="secondary-btn" 
                      type="button" 
                      onClick={() => alEditar?.(reporte)}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px', 
                        padding: '12px 20px', fontWeight: '700', fontSize: '14px', flex: 1, 
                        justifyContent: 'center', border: '1px solid #e2e8f0', background: '#f8fafc',
                        color: '#475569', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#1e293b'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#475569'; }}
                    >
                      ✏️ Editar Reporte
                    </button>
                    <button 
                      className="danger-btn" 
                      type="button" 
                      onClick={() => setConfirmandoEliminacion(true)}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px', 
                        padding: '12px 20px', fontWeight: '700', fontSize: '14px', background: '#fee2e2', 
                        color: '#ef4444', border: '1px solid #fecaca', cursor: 'pointer', flex: 1, 
                        justifyContent: 'center', transition: 'all 0.2s' 
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#b91c1c'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444'; }}
                    >
                      🗑️ Eliminar Reporte
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
