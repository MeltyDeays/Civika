import { useState, useMemo } from "react";
import { useTareasTecnico } from "../Controladores/useTareasTecnico";
import ModalDetalleReporte from "../../../modals/ReportDetailModal";

const PRIORIDAD_ESTILOS = {
  critica: { color: '#ef4444', bg: '#fef2f2', label: 'Crítica' },
  alta: { color: '#f59e0b', bg: '#fff7ed', label: 'Alta' },
  media: { color: '#3b82f6', bg: '#eff6ff', label: 'Media' },
  baja: { color: '#10b981', bg: '#ecfdf5', label: 'Baja' },
};

const COL_COLORES = {
  pendiente: '#64748b',
  en_reparacion: '#2563eb',
  completado: '#10b981',
  rechazado: '#ef4444',
};

export default function TareasView() {
  const { agrupado, historial, statsHistorial, cargando, error, cambiarEstado } = useTareasTecnico();
  const [moviendo, setMoviendo] = useState("");
  const [vistaActiva, setVistaActiva] = useState("kanban"); // "kanban" | "historial"
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);

  // H026: Modal de comentario de cierre
  const [modalCierre, setModalCierre] = useState(null); // { denunciaId, nuevoEstado, titulo }
  const [comentarioCierre, setComentarioCierre] = useState("");
  const [errorComentario, setErrorComentario] = useState("");

  const stats = useMemo(() => {
    if (!agrupado) return { total: 0, urgentes: 0 };
    let total = 0;
    let urgentes = 0;
    agrupado.forEach(col => {
      total += col.items.length;
      urgentes += col.items.filter(i => i.prioridad === 'critica' || i.prioridad === 'alta').length;
    });
    return { total, urgentes };
  }, [agrupado]);

  /** Determina si un estado es final (no se puede mover más) */
  const esFinal = (estado) => estado === "completado" || estado === "rechazado";

  /** Para estados NO finales: mover directamente */
  const moverTarea = async (denunciaId, nuevoEstado) => {
    setMoviendo(denunciaId);
    try {
      await cambiarEstado(denunciaId, nuevoEstado);
    } catch (e) {
      console.error(e);
    } finally {
      setMoviendo("");
    }
  };

  /** Para estados FINALES: abrir modal de comentario obligatorio */
  const abrirModalCierre = (denunciaId, nuevoEstado, titulo) => {
    setModalCierre({ denunciaId, nuevoEstado, titulo });
    setComentarioCierre("");
    setErrorComentario("");
  };

  /** Confirmar cierre con comentario obligatorio */
  const confirmarCierre = async () => {
    const texto = comentarioCierre.trim();
    if (texto.length < 10) {
      setErrorComentario("El comentario de cierre debe tener al menos 10 caracteres.");
      return;
    }
    setMoviendo(modalCierre.denunciaId);
    try {
      await cambiarEstado(modalCierre.denunciaId, modalCierre.nuevoEstado, texto);
      setModalCierre(null);
    } catch (e) {
      setErrorComentario(e.message);
    } finally {
      setMoviendo("");
    }
  };

  return (
    <section className="tecnico-container">
      {/* Inyección de estilos responsivos premium */}
      <style dangerouslySetInnerHTML={{ __html: `
        .tecnico-container {
          padding: 2rem;
          background: #f8fafc;
          min-height: 100vh;
          box-sizing: border-box;
          width: 100%;
        }
        .tecnico-header {
          background: linear-gradient(135deg, #5b1125 0%, #1a0f12 50%, #0c090a 100%); 
          border-radius: 24px; 
          padding: 2.5rem; 
          color: #fff;
          margin-bottom: 2.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 20px 40px -15px rgba(122, 24, 53, 0.25);
          box-sizing: border-box;
          border: 1px solid rgba(194, 159, 104, 0.15);
        }
        .tecnico-header-info h1 {
          margin: 0; 
          font-size: 2.3rem; 
          font-weight: 850;
          letter-spacing: -0.8px;
          line-height: 1.2;
          background: linear-gradient(120deg, #ffffff 60%, #f3e8ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .tecnico-header-info p {
          margin: 10px 0 0; 
          opacity: 0.85; 
          font-size: 1.05rem;
          line-height: 1.5;
          max-width: 600px;
        }
        .tecnico-stats-container {
          display: flex;
          gap: 1.25rem;
          flex-shrink: 0;
        }
        .tecnico-stat-card {
          text-align: center;
          background: rgba(255,255,255,0.05);
          padding: 1rem 2rem;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.1);
          min-width: 90px;
        }
        .tecnico-stat-card.urgente {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.25);
        }
        .tecnico-stat-card.completada {
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.25);
        }
        .tecnico-stat-card.resolucion {
          background: rgba(59, 130, 246, 0.12);
          border: 1px solid rgba(59, 130, 246, 0.25);
        }
        .tecnico-toggles {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        .tecnico-toggle-btn {
          padding: 12px 24px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          font-weight: 700;
          font-size: 0.95rem;
          transition: all 0.25s ease;
        }
        .tecnico-kanban-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          align-items: start;
          box-sizing: border-box;
          width: 100%;
        }
        .tecnico-kanban-column {
          background: #fff; 
          border-radius: 20px; 
          overflow: hidden;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04);
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }
        .tecnico-column-body {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-height: 500px;
          box-sizing: border-box;
        }
        .tecnico-column-header {
          padding: 14px 18px; 
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .tecnico-card {
          background: #fff;
          border-radius: 16px;
          padding: 1.25rem;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
          cursor: default;
          box-sizing: border-box;
        }
        .tecnico-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
        }
        .tecnico-card.finalizada {
          background: #f8fafc;
          opacity: 0.75;
          cursor: default;
        }
        .tecnico-card.finalizada:hover {
          transform: none;
          box-shadow: none;
        }
        .tecnico-empty-placeholder {
          text-align: center;
          padding: 2.5rem 1rem;
          border: 2px dashed #cbd5e1;
          border-radius: 16px;
          color: #94a3b8;
          font-size: 0.85rem;
          font-weight: 600;
          background: #fcfcfc;
        }

        /* Adaptabilidad Responsiva */
        @media (max-width: 900px) {
          .tecnico-header {
            flex-direction: column;
            align-items: stretch;
            padding: 2rem;
            gap: 1.5rem;
          }
          .tecnico-header-info h1 {
            font-size: 1.85rem;
            text-align: center;
          }
          .tecnico-header-info p {
            font-size: 0.95rem;
            text-align: center;
          }
          .tecnico-stats-container {
            justify-content: center;
            gap: 1rem;
          }
          .tecnico-stat-card {
            padding: 0.85rem 1.5rem;
            flex: 1;
            min-width: 0;
          }
        }
        @media (max-width: 600px) {
          .tecnico-container {
            padding: 1rem 0.5rem;
          }
          .tecnico-header {
            padding: 1.5rem;
            border-radius: 18px;
            margin-bottom: 1.75rem;
          }
          .tecnico-header-info h1 {
            font-size: 1.65rem;
          }
          .tecnico-header-info p {
            font-size: 0.88rem;
          }
          .tecnico-toggles {
            gap: 0.5rem;
            margin-bottom: 1.5rem;
          }
          .tecnico-toggle-btn {
            padding: 10px 12px;
            font-size: 0.82rem;
            border-radius: 10px;
          }
          .tecnico-kanban-grid {
            grid-template-columns: 1fr;
            gap: 1.25rem;
          }
          .tecnico-kanban-column {
            border-radius: 16px;
          }
          .tecnico-card {
            padding: 1.1rem;
          }
          .tecnico-column-body {
            min-height: auto;
            padding: 8px;
          }
          .tecnico-empty-placeholder {
            padding: 1.25rem 1rem;
            font-size: 0.8rem;
          }
        }
      `}} />

      {/* Header Premium para Técnico */}
      <header className="tecnico-header">
        <div className="tecnico-header-info">
          <h1>Panel de Operaciones</h1>
          <p>Gestiona los reportes asignados a tu cuadrilla y actualiza el progreso en tiempo real.</p>
        </div>
        <div className="tecnico-stats-container">
          {vistaActiva === "kanban" ? (
            <>
              <div className="tecnico-stat-card">
                <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{stats.total}</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.7, fontWeight: '600', textTransform: 'uppercase' }}>Tareas</div>
              </div>
              <div className="tecnico-stat-card urgente">
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f87171' }}>{stats.urgentes}</div>
                <div style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: '600', textTransform: 'uppercase' }}>Prioridad</div>
              </div>
            </>
          ) : (
            <>
              <div className="tecnico-stat-card completada">
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#34d399' }}>{statsHistorial.completadas}</div>
                <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: '600', textTransform: 'uppercase' }}>Completadas</div>
              </div>
              <div className="tecnico-stat-card urgente">
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f87171' }}>{statsHistorial.rechazadas}</div>
                <div style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: '600', textTransform: 'uppercase' }}>Rechazadas</div>
              </div>
              <div className="tecnico-stat-card resolucion">
                <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#60a5fa' }}>{statsHistorial.ratio}%</div>
                <div style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: '600', textTransform: 'uppercase' }}>Resolución</div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Toggles (Kanban vs Historial) */}
      <div className="tecnico-toggles">
        <button 
          onClick={() => setVistaActiva("kanban")}
          className="tecnico-toggle-btn"
          style={{ 
            background: vistaActiva === "kanban" ? '#1e293b' : '#e2e8f0', 
            color: vistaActiva === "kanban" ? '#fff' : '#64748b',
            boxShadow: vistaActiva === "kanban" ? '0 4px 12px rgba(30, 41, 59, 0.2)' : 'none'
          }}
        >
          📋 Tablero Kanban
        </button>
        <button 
          onClick={() => setVistaActiva("historial")}
          className="tecnico-toggle-btn"
          style={{ 
            background: vistaActiva === "historial" ? '#1e293b' : '#e2e8f0', 
            color: vistaActiva === "historial" ? '#fff' : '#64748b',
            boxShadow: vistaActiva === "historial" ? '0 4px 12px rgba(30, 41, 59, 0.2)' : 'none'
          }}
        >
          📊 Historial de Cierres
        </button>
      </div>

      {cargando && <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontWeight: '700' }}>Cargando tablero operativo...</div>}
      {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '1rem', borderRadius: '12px', marginBottom: '2rem' }}>{error}</div>}

      {vistaActiva === "kanban" ? (
        /* Kanban Operativo — fluido */
        <div className="tecnico-kanban-grid">
        {agrupado.map((col) => (
          <div key={col.id} className="tecnico-kanban-column">
            {/* Column Header */}
            <div className="tecnico-column-header" style={{ background: COL_COLORES[col.key] || '#64748b' }}>
              <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '800', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {col.title}
              </h3>
              <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '2px 10px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '800' }}>
                {col.items.length}
              </span>
            </div>

            {/* Cards */}
            <div className="tecnico-column-body">
              {col.items.map((tarea) => {
                const estilo = PRIORIDAD_ESTILOS[tarea.prioridad] || PRIORIDAD_ESTILOS.media;
                const finalizada = esFinal(tarea.estado);
                return (
                  <article key={tarea.id} className={`tecnico-card ${finalizada ? 'finalizada' : ''}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                      <span style={{ 
                        background: estilo.bg, color: estilo.color, 
                        padding: '4px 10px', borderRadius: '10px', 
                        fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase'
                      }}>
                        {estilo.label}
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '600' }}>#{tarea.id.slice(0, 5)}</span>
                    </div>

                    <h4 style={{ margin: '0 0 8px', fontSize: '0.95rem', color: '#1e293b', fontWeight: '700', lineHeight: 1.4 }}>{tarea.titulo}</h4>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.8rem', marginBottom: '14px' }}>
                      <span>📍</span>
                      <span style={{ fontWeight: '500' }}>{tarea.municipio}</span>
                    </div>

                    {/* Comentario de cierre (si ya fue cerrado) */}
                    {finalizada && tarea.comentario_cierre && (
                      <div style={{
                        background: tarea.estado === 'completado' ? '#f0fdf4' : '#fef2f2',
                        border: `1px solid ${tarea.estado === 'completado' ? '#bbf7d0' : '#fecaca'}`,
                        borderRadius: '10px', padding: '10px', marginBottom: '10px',
                        fontSize: '0.8rem', color: '#475569', lineHeight: 1.5
                      }}>
                        <strong style={{ display: 'block', marginBottom: '4px', fontSize: '0.7rem', textTransform: 'uppercase', color: tarea.estado === 'completado' ? '#16a34a' : '#dc2626' }}>
                          📝 Comentario de cierre:
                        </strong>
                        {tarea.comentario_cierre}
                      </div>
                    )}

                    {/* Botones de acción */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                      <button 
                        style={{ flex: 1, background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '10px', fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.15s' }}
                        onClick={() => setReporteSeleccionado(tarea)}
                      >
                        🗺️ Mapa
                      </button>
                      
                      {!finalizada && (
                        <>
                          {tarea.estado !== "en_reparacion" && (
                            <button 
                              style={{ flex: 1, background: '#eff6ff', color: '#2563eb', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.15s' }}
                              disabled={moviendo === tarea.id}
                              onClick={() => moverTarea(tarea.id, "en_reparacion")}
                            >
                              ▶ Iniciar
                            </button>
                          )}
                          <button 
                            style={{ flex: 1, background: '#ecfdf5', color: '#10b981', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.15s' }}
                            disabled={moviendo === tarea.id}
                            onClick={() => abrirModalCierre(tarea.id, "completado", tarea.titulo)}
                          >
                            ✓ Resuelto
                          </button>
                          <button 
                            style={{ flex: 1, background: '#fef2f2', color: '#dc2626', border: 'none', padding: '10px', borderRadius: '10px', fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.15s' }}
                            disabled={moviendo === tarea.id}
                            onClick={() => abrirModalCierre(tarea.id, "rechazado", tarea.titulo)}
                          >
                            ✖ Rechazar
                          </button>
                        </>
                      )}
                    </div>

                    {/* Badge para estados finales */}
                    {finalizada && (
                      <div style={{ 
                        textAlign: 'center', padding: '8px', borderRadius: '10px', 
                        background: tarea.estado === 'completado' ? '#ecfdf5' : '#fef2f2',
                        color: tarea.estado === 'completado' ? '#10b981' : '#ef4444',
                        fontWeight: '800', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px',
                        marginTop: '10px'
                      }}>
                        {tarea.estado === 'completado' ? '✅ Caso Resuelto' : '🚫 Caso Rechazado'}
                      </div>
                    )}
                  </article>
                );
              })}

              {col.items.length === 0 && (
                <div className="tecnico-empty-placeholder">
                  Sin tareas aquí
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      ) : (
        /* Vista de Historial (H051) */
        <div className="tecnico-kanban-grid">
          {historial.length === 0 && (
            <div className="tecnico-empty-container">
              <div className="tecnico-empty-icon-wrapper">📮</div>
              <h3>No hay tareas cerradas</h3>
              <p>Las tareas que marques como completadas o rechazadas aparecerán aquí.</p>
            </div>
          )}
          {historial.map(tarea => {
            const estilo = PRIORIDAD_ESTILOS[tarea.prioridad] || PRIORIDAD_ESTILOS.media;
            const esExito = tarea.estado === 'completado';
            return (
              <article key={tarea.id} style={{ 
                background: '#fff', borderRadius: '16px', padding: '1.5rem', border: `1px solid ${esExito ? '#bbf7d0' : '#fecaca'}`,
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden'
              }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: esExito ? '#10b981' : '#ef4444' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <span style={{ background: esExito ? '#ecfdf5' : '#fef2f2', color: esExito ? '#10b981' : '#ef4444', padding: '4px 10px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' }}>
                    {esExito ? '✅ Resuelto' : '🚫 Rechazado'}
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: '600' }}>{new Date(tarea.actualizado_el || tarea.creado_el).toLocaleDateString()}</span>
                </div>

                <h4 style={{ margin: '0 0 10px', fontSize: '1.05rem', color: '#1e293b', fontWeight: '700', lineHeight: 1.4 }}>{tarea.titulo}</h4>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.85rem', marginBottom: '16px' }}>
                  <span>📍</span>
                  <span style={{ fontWeight: '500' }}>{tarea.municipio}</span>
                  <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
                  <span style={{ background: estilo.bg, color: estilo.color, padding: '2px 8px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '700' }}>
                    {estilo.label}
                  </span>
                </div>

                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
                  <strong style={{ display: 'block', marginBottom: '6px', fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8' }}>
                    Comentario de Cierre:
                  </strong>
                  {tarea.comentario_cierre || <span style={{ fontStyle: 'italic', color: '#cbd5e1' }}>Sin comentarios</span>}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ────────── Modal de Comentario de Cierre (H026) ────────── */}
      {modalCierre && (
        <div
          onClick={() => setModalCierre(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
            backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 9999, padding: '2rem'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '24px', width: 'min(520px, 95%)',
              overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
            }}
          >
            {/* Modal Header */}
            <div style={{
              background: modalCierre.nuevoEstado === 'completado'
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              padding: '1.5rem 2rem', color: '#fff'
            }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800' }}>
                {modalCierre.nuevoEstado === 'completado' ? '✅ Marcar como Resuelto' : '🚫 Rechazar Reporte'}
              </h2>
              <p style={{ margin: '6px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
                {modalCierre.titulo}
              </p>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '2rem' }}>
              <label style={{
                display: 'block', fontSize: '0.85rem', fontWeight: '800',
                color: '#475569', marginBottom: '10px', textTransform: 'uppercase'
              }}>
                {modalCierre.nuevoEstado === 'completado'
                  ? 'Describe cómo se resolvió el problema *'
                  : 'Justifica por qué se rechaza este reporte *'
                }
              </label>
              <textarea
                rows={4}
                placeholder={modalCierre.nuevoEstado === 'completado'
                  ? 'Ej: Se reparó el bache con mezcla asfáltica en caliente. Superficie nivelada y compactada.'
                  : 'Ej: Se inspeccionó la zona y no se encontró la irregularidad reportada. Reporte falso.'
                }
                value={comentarioCierre}
                onChange={(e) => { setComentarioCierre(e.target.value); setErrorComentario(""); }}
                style={{
                  width: '100%', padding: '14px', borderRadius: '12px',
                  border: errorComentario ? '2px solid #ef4444' : '1px solid #e2e8f0',
                  background: '#f8fafc', fontSize: '0.95rem', resize: 'none',
                  fontFamily: 'inherit', lineHeight: 1.6, outline: 'none',
                  transition: 'border 0.2s'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                {errorComentario ? (
                  <span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: '700' }}>{errorComentario}</span>
                ) : (
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Mínimo 10 caracteres</span>
                )}
                <span style={{ color: comentarioCierre.trim().length >= 10 ? '#10b981' : '#94a3b8', fontSize: '0.8rem', fontWeight: '700' }}>
                  {comentarioCierre.trim().length}/10
                </span>
              </div>

              {/* Botones */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '1.5rem' }}>
                <button
                  onClick={() => setModalCierre(null)}
                  style={{
                    flex: 1, padding: '14px', borderRadius: '12px',
                    border: '1px solid #e2e8f0', background: '#fff',
                    color: '#475569', fontWeight: '700', cursor: 'pointer',
                    fontSize: '0.95rem'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarCierre}
                  disabled={moviendo === modalCierre.denunciaId || comentarioCierre.trim().length < 10}
                  style={{
                    flex: 1, padding: '14px', borderRadius: '12px', border: 'none',
                    background: comentarioCierre.trim().length >= 10
                      ? (modalCierre.nuevoEstado === 'completado' ? '#10b981' : '#ef4444')
                      : '#cbd5e1',
                    color: '#fff', fontWeight: '800', cursor: comentarioCierre.trim().length >= 10 ? 'pointer' : 'not-allowed',
                    fontSize: '0.95rem', transition: 'all 0.2s',
                    boxShadow: comentarioCierre.trim().length >= 10 ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
                  }}
                >
                  {moviendo === modalCierre.denunciaId ? 'Procesando...' : 'Confirmar Cierre'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {reporteSeleccionado && (
        <ModalDetalleReporte
          reporte={reporteSeleccionado}
          alCerrar={() => setReporteSeleccionado(null)}
          soloLectura
        />
      )}
    </section>
  );
}
