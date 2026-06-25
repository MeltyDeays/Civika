import { useMemo, useState, useEffect } from "react";
import { COLUMNAS_KANBAN, DEPARTAMENTOS_NICARAGUA } from "../../../utils/constants";
import { useKanbanAdmin } from "../Controladores/useKanbanAdmin";
import { formatearFecha } from "../../../utils/formatters";

const PRIORIDAD_ESTILOS = {
  critica: { color: '#fff', bg: '#ef4444', label: 'Crítica' },
  alta: { color: '#fff', bg: '#f97316', label: 'Alta' },
  media: { color: '#fff', bg: '#3b82f6', label: 'Media' },
  baja: { color: '#fff', bg: '#10b981', label: 'Baja' },
};

const COLUMN_STYLES = {
  0: { dot: '#f59e0b', label: 'Cola', icon: '⏳' },
  1: { dot: '#3b82f6', label: 'En Desarrollo', icon: '📊' },
  2: { dot: '#10b981', label: 'Completados', icon: '✅' },
};

// Colores para avatares de equipo
const AVATAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminEntidadKanbanView() {
  const vm = useKanbanAdmin();
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const [cierreInfo, setCierreInfo] = useState(null);
  const [cierreNotas, setCierreNotas] = useState("");

  const alMover = (id, destino) => {
    if (destino === 2) {
      setCierreNotas("");
      setCierreInfo({ id, destino });
    } else {
      vm.manejarMover(id, destino);
    }
  };

  const agrupado = useMemo(() => {
    return COLUMNAS_KANBAN.map((column) => ({
      ...column,
      items: vm.tareasActivas.filter((t) => t.indice_columna === column.id),
    }));
  }, [vm.tareasActivas]);

  const totalActivas = vm.tareasActivas.length;

  return (
    <section style={{ padding: isMobile ? '12px 16px' : '28px 32px', background: '#f1f5f9', minHeight: '100%', paddingBottom: '4rem' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', 
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'stretch' : 'flex-start', 
        marginBottom: '16px',
        gap: isMobile ? '8px' : '0'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: isMobile ? '22px' : '28px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
            Tablero de Proyectos
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: isMobile ? '12px' : '14px', fontWeight: '500' }}>
            Arrastra las tarjetas entre columnas para actualizar el estado del proyecto
          </p>
        </div>
        <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600', marginTop: isMobile ? '4px' : '8px' }}>
          {totalActivas} proyectos totales
        </span>
      </div>

      {/* Summary dots */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? '10px 16px' : '20px', marginBottom: '20px' }}>
        {agrupado.map((col) => {
          const style = COLUMN_STYLES[col.id] || COLUMN_STYLES[0];
          return (
            <div key={col.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: style.dot }} />
              {style.label}: {col.items.length}
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="toolbar-premium" style={{
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        gap: '10px', 
        marginBottom: '20px', 
        padding: '12px 14px',
        background: '#fff', 
        borderRadius: '12px', 
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)', 
        alignItems: isMobile ? 'stretch' : 'center'
      }}>
        <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600', display: isMobile ? 'none' : 'inline' }}>Filtrar:</span>
        <select
          value={vm.filtroDept}
          onChange={(e) => vm.cambiarDepartamento(e.target.value)}
          style={{
            padding: '7px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
            background: '#f8fafc', fontWeight: '600', color: '#475569', fontSize: '13px',
            width: isMobile ? '100%' : 'auto'
          }}
        >
          <option value="Todos">Todos los departamentos</option>
          {Object.keys(DEPARTAMENTOS_NICARAGUA).map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        {vm.filtroDept !== "Todos" && (
          <select
            value={vm.filtroCity}
            onChange={(e) => vm.setFiltroCity(e.target.value)}
            style={{
              padding: '7px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
              background: '#f8fafc', fontWeight: '600', color: '#475569', fontSize: '13px',
              width: isMobile ? '100%' : 'auto'
            }}
          >
            <option value="Todos">Todos los municipios</option>
            {vm.ciudadesDisponibles.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        <div style={{ marginLeft: isMobile ? '0' : 'auto', width: isMobile ? '100%' : 'auto' }}>
          <button
            onClick={() => vm.setMostrarHistorial(true)}
            style={{
              background: '#0f172a', color: '#fff', border: 'none',
              padding: '8px 16px', borderRadius: '10px', fontWeight: '700',
              fontSize: '12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              width: isMobile ? '100%' : 'auto',
              justifyContent: 'center'
            }}
          >
            📂 Historial ({vm.historial.length})
          </button>
        </div>
      </div>

      {/* Kanban Columns */}
      {vm.cargando ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b', fontWeight: '600' }}>
          ⏳ Cargando tablero...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'start' }}>
          {agrupado.map((column) => {
            const colStyle = COLUMN_STYLES[column.id] || COLUMN_STYLES[0];
            return (
              <div key={column.id} style={{
                background: '#fff', borderRadius: '16px',
                border: '1px solid #e2e8f0', overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}>
                {/* Column Header */}
                <div style={{
                  padding: '14px 18px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  borderBottom: '1px solid #f1f5f9'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      width: '10px', height: '10px', borderRadius: '50%',
                      background: colStyle.dot
                    }} />
                    <h3 style={{
                      margin: 0, fontSize: '14px', fontWeight: '700', color: '#0f172a'
                    }}>
                      {colStyle.label}
                    </h3>
                    <span style={{
                      background: '#f1f5f9', color: '#64748b',
                      padding: '2px 8px', borderRadius: '10px',
                      fontSize: '11px', fontWeight: '800'
                    }}>
                      {column.items.length}
                    </span>
                  </div>
                  <span style={{ fontSize: '14px' }}>{colStyle.icon}</span>
                </div>

                {/* Cards */}
                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: '400px' }}>
                  {column.items.map((item) => {
                    const prio = PRIORIDAD_ESTILOS[item.prioridad] || PRIORIDAD_ESTILOS.media;
                    const isMoving = vm.idMoviendo === item.id;
                    // Simulated progress based on column
                    const progreso = column.id === 0 ? 0 : column.id === 1 ? Math.floor(Math.random() * 50 + 30) : 100;

                    return (
                      <article key={item.id} onClick={() => vm.abrirDetalleTarea(item)} style={{
                        background: '#fff', borderRadius: '14px',
                        border: '1px solid #e2e8f0', overflow: 'hidden',
                        opacity: isMoving ? 0.5 : 1, transition: 'all 0.2s',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer'
                      }}>
                        {/* Card Image */}
                        <div style={{ position: 'relative', height: '140px', overflow: 'hidden', background: '#e2e8f0' }}>
                          {item.url_imagen ? (
                            <img
                              src={item.url_imagen}
                              alt={item.titulo}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{
                              width: '100%', height: '100%',
                              background: 'linear-gradient(135deg, #1e293b, #334155)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '32px', opacity: 0.5
                            }}>
                              {item.problematica?.icono || '🏗️'}
                            </div>
                          )}
                          {/* Urgency Badge Overlay */}
                          <span style={{
                            position: 'absolute', top: '10px', left: '10px',
                            padding: '4px 12px', borderRadius: '8px',
                            fontSize: '11px', fontWeight: '800',
                            background: prio.bg, color: prio.color,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                          }}>
                            ● {prio.label}
                          </span>
                        </div>

                        {/* Card Content */}
                        <div style={{ padding: '14px 16px' }}>
                          <h4 style={{
                            margin: '0 0 6px', fontSize: '14px', fontWeight: '700',
                            color: '#0f172a', lineHeight: 1.3,
                            overflow: 'hidden', textOverflow: 'ellipsis',
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                          }}>
                            {item.titulo}
                          </h4>
                          <p style={{
                            margin: '0 0 12px', color: '#94a3b8',
                            fontSize: '12px', fontWeight: '500'
                          }}>
                            📍 {item.municipio}, {item.departamento}
                          </p>

                          {/* Progress Bar (for columns 1 and 2) */}
                          {column.id > 0 && (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{
                                display: 'flex', justifyContent: 'space-between',
                                fontSize: '11px', color: '#94a3b8', fontWeight: '600', marginBottom: '4px'
                              }}>
                                <span>Progreso</span>
                                <span>{progreso}%</span>
                              </div>
                              <div style={{
                                height: '6px', borderRadius: '3px',
                                background: '#f1f5f9', overflow: 'hidden'
                              }}>
                                <div style={{
                                  height: '100%', borderRadius: '3px',
                                  width: `${progreso}%`,
                                  background: column.id === 2
                                    ? 'linear-gradient(90deg, #10b981, #059669)'
                                    : 'linear-gradient(90deg, #3b82f6, #2563eb)',
                                  transition: 'width 0.5s ease'
                                }} />
                              </div>
                            </div>
                          )}

                          {/* Footer: Avatars + Date */}
                          <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                          }}>
                            {/* Team avatars */}
                            <div style={{ display: 'flex' }}>
                              {[0, 1].map(i => (
                                <div key={i} style={{
                                  width: '26px', height: '26px', borderRadius: '50%',
                                  background: AVATAR_COLORS[(item.id.charCodeAt(0) + i) % AVATAR_COLORS.length],
                                  border: '2px solid #fff',
                                  marginLeft: i > 0 ? '-8px' : '0',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '10px', fontWeight: '800', color: '#fff'
                                }}>
                                  {String.fromCharCode(65 + (item.id.charCodeAt(i % item.id.length) % 26))}
                                </div>
                              ))}
                            </div>
                            <span style={{
                              fontSize: '11px', color: '#94a3b8', fontWeight: '600',
                              display: 'flex', alignItems: 'center', gap: '4px'
                            }}>
                              📅 {item.fecha_fin ? 'Vencido' : 'Activo'}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div onClick={e => e.stopPropagation()} style={{
                            display: 'flex', gap: '6px', marginTop: '12px',
                            borderTop: '1px solid #f1f5f9', paddingTop: '12px'
                          }}>
                            {column.id > 0 && (
                              <button
                                disabled={isMoving}
                                onClick={() => alMover(item.id, column.id - 1)}
                                style={{
                                  flex: 1, padding: '8px', borderRadius: '8px',
                                  border: '1px solid #e2e8f0', background: '#f8fafc',
                                  color: '#475569', fontSize: '11px', fontWeight: '700',
                                  cursor: 'pointer'
                                }}
                              >
                                ← {COLUMNAS_KANBAN[column.id - 1]?.title}
                              </button>
                            )}
                            {column.id === 0 && (
                              <button
                                disabled={isMoving}
                                onClick={() => vm.manejarQuitar(item.id)}
                                style={{
                                  padding: '8px 12px', borderRadius: '8px',
                                  border: '1px solid #fecaca', background: '#fef2f2',
                                  color: '#ef4444', fontSize: '11px', fontWeight: '700',
                                  cursor: 'pointer'
                                }}
                              >
                                🗑️
                              </button>
                            )}
                            {column.id < 2 && (
                              <button
                                disabled={isMoving}
                                onClick={() => alMover(item.id, column.id + 1)}
                                style={{
                                  flex: 1, padding: '8px', borderRadius: '8px',
                                  border: '1px solid #dbeafe', background: '#eff6ff',
                                  color: '#2563eb', fontSize: '11px', fontWeight: '700',
                                  cursor: 'pointer'
                                }}
                              >
                                {COLUMNAS_KANBAN[column.id + 1]?.title} →
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}

                  {column.items.length === 0 && (
                    <div style={{
                      textAlign: 'center', padding: '2.5rem 1rem',
                      border: '2px dashed #e2e8f0', borderRadius: '14px',
                      color: '#cbd5e1', fontSize: '13px', fontWeight: '600'
                    }}>
                      Sin tareas aquí
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer hint */}
      <div style={{
        marginTop: '20px', textAlign: 'center', fontSize: '12px',
        color: '#94a3b8', fontWeight: '500'
      }}>
        ℹ️ Haz click en una tarjeta para ver detalles y gestionar el equipo. Agrega nuevos proyectos desde <a href="/admin/reportes" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Reportes</a> o desde el <a href="/admin/mapa-calor" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Mapa de Calor</a>.
      </div>

      {/* Historial Modal - preserved from original */}
      {vm.mostrarHistorial && (
        <div
          className="modal-backdrop"
          onClick={() => vm.setMostrarHistorial(false)}
          style={{ backdropFilter: 'blur(8px)', padding: '2rem', background: 'rgba(15,23,42,0.6)' }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 'min(700px, 95%)', padding: 0, overflow: 'hidden',
              borderRadius: '20px', maxHeight: '85vh', display: 'flex', flexDirection: 'column',
              boxShadow: '0 25px 50px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              padding: '1.5rem 2rem', color: '#fff',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '800' }}>📂 Historial</h2>
                <p style={{ margin: '4px 0 0', opacity: 0.7, fontSize: '0.85rem' }}>Tareas completadas hace más de 8 horas</p>
              </div>
              <button
                onClick={() => vm.setMostrarHistorial(false)}
                style={{
                  background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
                  borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer',
                  fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >✕</button>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', background: '#f8fafc' }}>
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '1.5rem',
                padding: '10px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0',
                alignItems: 'center'
              }}>
                <input
                  type="text" placeholder="🔍 Buscar..."
                  value={vm.histBusqueda}
                  onChange={(e) => vm.setHistBusqueda(e.target.value)}
                  style={{
                    flex: '1 1 180px', border: '1px solid #e2e8f0', borderRadius: '8px',
                    padding: '8px 12px', fontSize: '13px', outline: 'none'
                  }}
                />
                <select value={vm.histFiltroPrio} onChange={(e) => vm.setHistFiltroPrio(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', fontWeight: '600' }}>
                  <option value="todas">Todas</option>
                  <option value="critica">Crítica</option>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
                <select value={vm.histFiltroDept} onChange={(e) => vm.cambiarHistDepartamento(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', fontWeight: '600' }}>
                  <option value="Todos">Todos</option>
                  {Object.keys(DEPARTAMENTOS_NICARAGUA).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {vm.historial.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📋</div>
                  <p style={{ fontWeight: '600' }}>Sin historial aún.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {vm.historial.map((item) => {
                    return (
                      <article key={item.id} style={{
                        background: '#fff', borderRadius: '12px', padding: '14px 16px',
                        border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', gap: '1rem'
                      }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: '#0f172a', fontWeight: '700' }}>{item.titulo}</h4>
                          <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px' }}>
                            📍 {item.municipio} · {formatearFecha(item.fecha_fin)}
                          </p>
                        </div>
                        <span style={{
                          background: '#ecfdf5', color: '#10b981', padding: '4px 12px',
                          borderRadius: '8px', fontSize: '11px', fontWeight: '800'
                        }}>✅ Resuelto</span>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {vm.tareaSeleccionada && <ModalAsignacion vm={vm} />}

      {/* Modal Premium de Notas de Cierre (para cuando se marca completado) */}
      {cierreInfo && (
        <div
          onClick={() => setCierreInfo(null)}
          style={{ 
            position: 'fixed', 
            inset: 0, 
            backgroundColor: 'rgba(15, 23, 42, 0.4)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 10000, 
            padding: '1rem', 
            backdropFilter: 'blur(8px)' 
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', 
              padding: '2rem', 
              borderRadius: '24px', 
              maxWidth: '460px', 
              width: '100%', 
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', 
              border: '1px solid #e2e8f0', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem', fontWeight: '800' }}>
                ✅ Completar Reparación
              </h3>
              <button
                onClick={() => setCierreInfo(null)}
                style={{
                  background: '#f1f5f9', border: 'none', color: '#475569',
                  borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer',
                  fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold'
                }}
              >✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', lineHeight: 1.4 }}>
                Detalla los materiales utilizados y los trabajos realizados para cerrar el proyecto (ej: <i>Se usaron 3 sacos de asfalto caliente y se selló la grieta principal</i>).
              </p>
              <textarea
                value={cierreNotas}
                onChange={(e) => setCierreNotas(e.target.value)}
                placeholder="Escribe las notas de cierre aquí..."
                rows={4}
                style={{
                  width: '100%', 
                  padding: '12px', 
                  borderRadius: '10px', 
                  border: '1px solid #cbd5e1', 
                  fontSize: '0.95rem',
                  outline: 'none',
                  fontWeight: '500',
                  color: '#1e293b',
                  resize: 'none',
                  marginTop: '8px',
                  fontFamily: 'inherit'
                }}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                onClick={() => setCierreInfo(null)}
                style={{ 
                  background: '#f1f5f9', 
                  color: '#475569', 
                  border: 'none', 
                  padding: '10px 18px', 
                  borderRadius: '10px', 
                  fontWeight: '700', 
                  fontSize: '0.875rem', 
                  cursor: 'pointer', 
                  transition: 'all 0.2s' 
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (cierreNotas.trim()) {
                    vm.manejarMover(cierreInfo.id, cierreInfo.destino, cierreNotas.trim());
                    setCierreInfo(null);
                  } else {
                    alert("Por favor ingresa detalles sobre el trabajo realizado antes de cerrar.");
                  }
                }}
                style={{
                  background: '#10b981',
                  color: '#fff', 
                  border: 'none', 
                  padding: '10px 18px', 
                  borderRadius: '10px', 
                  fontWeight: '700', 
                  fontSize: '0.875rem', 
                  cursor: 'pointer', 
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 6px rgba(16,185,129,0.2)'
                }}
              >
                Completar Proyecto
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ModalAsignacion({ vm }) {
  const tarea = vm.tareaSeleccionada;
  const [responsable, setResponsable] = useState(vm.detalleAsignacion.id_responsable || "");
  const [cuadrilla, setCuadrilla] = useState(vm.detalleAsignacion.id_cuadrilla_asignada || "");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setResponsable(vm.detalleAsignacion.id_responsable || "");
      setCuadrilla(vm.detalleAsignacion.id_cuadrilla_asignada || "");
    }, 0);
    return () => clearTimeout(timer);
  }, [vm.detalleAsignacion]);

  const guardar = async () => {
    try {
      await vm.guardarAsignacion(tarea.id, responsable || null, cuadrilla || null);
      setMsg("✅ Asignación guardada");
      setTimeout(() => vm.cerrarDetalleTarea(), 800);
    } catch (e) {
      setMsg("❌ " + e.message);
    }
  };

  const prio = PRIORIDAD_ESTILOS[tarea.prioridad] || PRIORIDAD_ESTILOS.media;

  return (
    <div onClick={() => vm.cerrarDetalleTarea()} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '2rem' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '24px', width: 'min(560px, 95%)', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '1.5rem 2rem', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <span style={{ background: prio.bg, color: prio.color, padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800' }}>{prio.label}</span>
              <h2 style={{ margin: '10px 0 0', fontSize: '1.2rem', fontWeight: '800' }}>{tarea.titulo}</h2>
              <p style={{ margin: '6px 0 0', opacity: 0.7, fontSize: '0.85rem' }}>📍 {tarea.municipio}, {tarea.departamento}</p>
            </div>
            <button onClick={() => vm.cerrarDetalleTarea()} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
          </div>
        </div>

        <div style={{ padding: '2rem' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '0.9rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Asignar Personal</h3>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>Técnico Responsable Individual</label>
            <select value={responsable} onChange={e => setResponsable(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: '600', fontSize: '0.9rem' }}>
              <option value="">Sin asignar</option>
              {vm.tecnicosEntidad.map(t => (
                <option key={t.id} value={t.id}>{t.nombre_completo} ({t.especialidad})</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>Cuadrilla Asignada</label>
            <select value={cuadrilla} onChange={e => setCuadrilla(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: '600', fontSize: '0.9rem' }}>
              <option value="">Sin cuadrilla</option>
              {vm.cuadrillasEntidad.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} — Líder: {c.perfiles?.nombre_completo || 'N/A'}</option>
              ))}
            </select>
          </div>

          {msg && <div style={{ padding: '10px', borderRadius: '10px', background: msg.startsWith('✅') ? '#ecfdf5' : '#fef2f2', color: msg.startsWith('✅') ? '#10b981' : '#ef4444', fontWeight: '700', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>{msg}</div>}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => vm.cerrarDetalleTarea()} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}>Cancelar</button>
            <button onClick={guardar} disabled={vm.guardandoAsignacion} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#1e293b', color: '#fff', fontWeight: '800', cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              {vm.guardandoAsignacion ? 'Guardando...' : '💾 Guardar Asignación'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
