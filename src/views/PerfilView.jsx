import { useState } from "react";
import { useAuth } from "../modules/auth/controllers/useAuth";
import { useDenunciasCiudadano } from "../Components/Ciudadanos/Controladores/useDenunciasCiudadano";
import { useSugerenciasCiudadano } from "../Components/Ciudadanos/Controladores/useSugerenciasCiudadano";
import ModalDetalleReporte from "../modals/ReportDetailModal";
import ModalFormularioReporte from "../modals/ReportFormModal";
import PaymentModal from "../modals/PaymentModal";

function formatearCedula(ced) {
  if (!ced) return "—";
  const limpio = ced.replace(/\D/g, "");
  if (limpio.length === 14) return `${limpio.slice(0,3)}-${limpio.slice(3,9)}-${limpio.slice(9)}`;
  return ced;
}

function formatearFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-NI", { year: "numeric", month: "long", day: "numeric" });
}

const ETIQUETAS_ROL = {
  ciudadano: { label: "Ciudadano", color: "#2563eb", bg: "rgba(37,99,235,0.1)" },
  admin_entidad: { label: "Admin Entidad", color: "#7c3aed", bg: "rgba(124,58,237,0.1)" },
  tecnico: { label: "Técnico", color: "#059669", bg: "rgba(5,150,105,0.1)" },
  super_admin: { label: "Super Admin", color: "#dc2626", bg: "rgba(220,38,38,0.1)" },
};

export default function VistaPerfil() {
  const { perfil, sesion, actualizarPerfil, solicitarBaja, logout } = useAuth();
  const { reportes, actualizarFirmaLocal, actualizar, eliminar, cargarReportes } = useDenunciasCiudadano();
  const { items: sugerencias, cargarSugerencias, actualizar: actualizarSug, eliminar: eliminarSug } = useSugerenciasCiudadano();

  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);
  const [editando, setEditando] = useState(false);
  const [nombreTemp, setNombreTemp] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [toast, setToast] = useState(null);
  const [modalBaja, setModalBaja] = useState(false);
  const [motivoBaja, setMotivoBaja] = useState("");
  const [procesandoBaja, setProcesandoBaja] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);

  const [modalFormularioAbierto, setModalFormularioAbierto] = useState(false);
  const [modoFormulario, setModoFormulario] = useState("crear");
  const [reporteEnEdicion, setReporteEnEdicion] = useState(null);
  const [denunciaPago, setDenunciaPago] = useState(null);

  const abrirEditar = (reporte) => {
    setModoFormulario("editar");
    setReporteEnEdicion(reporte);
    setModalFormularioAbierto(true);
  };

  const guardarReporte = async (payload) => {
    try {
      if (modoFormulario === "editar" && reporteEnEdicion?.id) {
        let actualizado;
        if (reporteEnEdicion.tipo_incidencia === 'sugerencia') {
          actualizado = await actualizarSug(reporteEnEdicion.id, payload);
          actualizado.tipo_incidencia = 'sugerencia';
        } else {
          actualizado = await actualizar(reporteEnEdicion.id, payload);
          actualizado.tipo_incidencia = 'denuncia';
        }

        if (reporteSeleccionado?.id === actualizado.id) {
          setReporteSeleccionado(actualizado);
        }
        setModalFormularioAbierto(false);
        mostrarToast("Actualizado con éxito.");
        return;
      }
    } catch (error) {
      mostrarToast("Ocurrió un error al guardar: " + error.message, "error");
    }
  };

  const borrarReporte = async (reporte) => {
    try {
      if (reporte.tipo_incidencia === 'sugerencia') {
        await eliminarSug(reporte.id);
      } else {
        await eliminar(reporte.id);
      }
      setReporteSeleccionado(null);
      mostrarToast("Eliminado correctamente.");
    } catch (error) {
      mostrarToast("Error al eliminar: " + error.message, "error");
    }
  };

  const mostrarToast = (msg, tipo = "ok") => {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  };

  const iniciarEdicion = () => {
    setNombreTemp(perfil?.nombre_completo || "");
    setEditando(true);
  };

  const cancelarEdicion = () => {
    setEditando(false);
    setNombreTemp("");
  };

  const guardarNombre = async () => {
    const val = nombreTemp.trim();
    if (val.length < 3) return mostrarToast("El nombre debe tener al menos 3 caracteres.", "error");
    setGuardando(true);
    try {
      await actualizarPerfil({ nombre_completo: val });
      setEditando(false);
      mostrarToast("Nombre actualizado correctamente.");
    } catch (e) {
      mostrarToast(e.message || "Error al actualizar.", "error");
    } finally {
      setGuardando(false);
    }
  };

  const confirmarBaja = async () => {
    if (motivoBaja.trim().length < 10) return mostrarToast("El motivo debe tener al menos 10 caracteres.", "error");
    setProcesandoBaja(true);
    try {
      await solicitarBaja();
      mostrarToast("Cuenta desactivada. Cerrando sesión...");
      setTimeout(() => logout(), 1800);
    } catch (e) {
      mostrarToast(e.message || "Error al desactivar.", "error");
      setProcesandoBaja(false);
    }
  };

  const iniciales = (perfil?.nombre_completo || "U").substring(0, 2).toUpperCase();
  const rolInfo = ETIQUETAS_ROL[perfil?.rol] || ETIQUETAS_ROL.ciudadano;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "2rem 1rem", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {toast && (
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 9999,
          padding: "14px 24px", borderRadius: 14,
          background: toast.tipo === "error" ? "#fef2f2" : "#f0fdf4",
          color: toast.tipo === "error" ? "#dc2626" : "#16a34a",
          border: `1px solid ${toast.tipo === "error" ? "#fecaca" : "#bbf7d0"}`,
          fontWeight: 700, fontSize: 14,
          boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
          animation: "slideInRight 0.35s cubic-bezier(0.16,1,0.3,1)"
        }}>
          {toast.tipo === "error" ? "⚠️" : "✅"} {toast.msg}
        </div>
      )}

      <div style={{
        background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)",
        borderRadius: 24, padding: "40px 32px", marginBottom: 24,
        position: "relative", overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", top: -40, right: -40, width: 180, height: 180,
          borderRadius: "50%", background: "rgba(37,99,235,0.15)", filter: "blur(40px)"
        }} />
        <div style={{
          position: "absolute", bottom: -30, left: -30, width: 140, height: 140,
          borderRadius: "50%", background: "rgba(16,185,129,0.12)", filter: "blur(30px)"
        }} />

        <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", gap: 24 }}>
          {perfil?.foto_selfie_url ? (
            <img src={perfil.foto_selfie_url} alt={perfil.nombre_completo}
              style={{
                width: 80, height: 80, borderRadius: 20, objectFit: "cover",
                boxShadow: "0 8px 24px rgba(37,99,235,0.35)", flexShrink: 0
              }}
            />
          ) : (
            <div style={{
              width: 80, height: 80, borderRadius: 20,
              background: "linear-gradient(135deg, #3b82f6, #2563eb)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, fontWeight: 900, color: "#fff",
              boxShadow: "0 8px 24px rgba(37,99,235,0.35)", flexShrink: 0
            }}>
              {iniciales}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            {editando ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  value={nombreTemp}
                  onChange={e => setNombreTemp(e.target.value)}
                  autoFocus
                  style={{
                    flex: 1, minWidth: 180, padding: "10px 16px", borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)",
                    color: "#fff", fontSize: 16, fontWeight: 700, outline: "none"
                  }}
                />
                <button onClick={guardarNombre} disabled={guardando} style={{
                  padding: "10px 20px", borderRadius: 12, border: "none",
                  background: "#10b981", color: "#fff", fontWeight: 700, fontSize: 14,
                  cursor: "pointer", transition: "all 0.2s"
                }}>
                  {guardando ? "..." : "Guardar"}
                </button>
                <button onClick={cancelarEdicion} style={{
                  padding: "10px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)",
                  background: "transparent", color: "#94a3b8", fontWeight: 600, fontSize: 14,
                  cursor: "pointer"
                }}>
                  Cancelar
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <h1 style={{ margin: 0, color: "#fff", fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>
                  {perfil?.nombre_completo || "Usuario"}
                </h1>
                <button onClick={iniciarEdicion} style={{
                  padding: "6px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)",
                  background: "rgba(255,255,255,0.06)", color: "#94a3b8", fontWeight: 600,
                  fontSize: 12, cursor: "pointer", transition: "all 0.2s"
                }}>
                  ✏️ Editar
                </button>
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
              <span style={{
                padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                color: rolInfo.color, background: rolInfo.bg,
                border: `1px solid ${rolInfo.color}22`
              }}>
                {rolInfo.label}
              </span>
              {perfil?.activo === false && (
                <span style={{
                  padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                  color: "#ef4444", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)"
                }}>
                  Cuenta Inactiva
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Indicador de Strikes para Ciudadanos */}
      {perfil?.rol === 'ciudadano' && (
        <div style={{
          background: "#fff", borderRadius: 24, padding: "24px 32px", marginBottom: 24,
          border: "1px solid #e2e8f0", boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
              ⚠️ Historial de Conducta
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
              Mantén un buen uso del servicio. Al llegar a 3 strikes tu cuenta será suspendida.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: perfil.strikes_totales > 0 ? "#ef4444" : "#64748b" }}>
              Strikes actuales: {perfil.strikes_totales || 0} / 3
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 3].map(stNum => {
                const activo = (perfil.strikes_totales || 0) >= stNum;
                return (
                  <div
                    key={stNum}
                    style={{
                      width: 14, height: 14, borderRadius: "50%",
                      background: activo ? "#ef4444" : "#e2e8f0",
                      boxShadow: activo ? "0 0 8px rgba(239,68,68,0.5)" : "none",
                      transition: "all 0.3s"
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div style={{
        background: "#fff", borderRadius: 24, padding: "32px",
        border: "1px solid #e2e8f0", boxShadow: "0 4px 24px rgba(0,0,0,0.04)"
      }}>
        <h2 style={{ margin: "0 0 24px", fontSize: 18, fontWeight: 800, color: "#1e293b" }}>
          📋 Información Personal
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
          {[
            { label: "Cédula", value: formatearCedula(perfil?.cedula), icon: "🪪" },
            { label: "Correo Electrónico", value: sesion?.user?.email || "—", icon: "📧" },
            { label: "Rol", value: rolInfo.label, icon: "🏷️" },
            { label: "Fecha de Registro", value: formatearFecha(perfil?.creado_el), icon: "📅" },
            ...(perfil?.especialidad ? [{ label: "Especialidad", value: perfil.especialidad, icon: "🔧" }] : []),
          ].map((item, i) => (
            <div key={i} style={{
              padding: "16px 20px", borderRadius: 16,
              background: "#f8fafc", border: "1px solid #f1f5f9",
              transition: "all 0.2s"
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <span>{item.icon}</span> {item.label}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", wordBreak: "break-word" }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historial de mis Reportes */}
      {perfil?.rol === 'ciudadano' && (() => {
        const misDenuncias = reportes
          .filter(r => r.id_ciudadano === sesion?.user?.id)
          .map(r => ({ ...r, tipo_incidencia: 'denuncia' }));

        const misSugerencias = sugerencias
          .filter(s => s.id_ciudadano === sesion?.user?.id)
          .map(s => ({ ...s, tipo_incidencia: 'sugerencia', categoria: 'Propuesta' }));

        const misElementos = [...misDenuncias, ...misSugerencias].sort(
          (a, b) => new Date(b.creado_el) - new Date(a.creado_el)
        );

        const reportesPorPagina = 5;
        const totalPaginas = Math.ceil(misElementos.length / reportesPorPagina);
        const indexUltimo = paginaActual * reportesPorPagina;
        const indexPrimer = indexUltimo - reportesPorPagina;
        const reportesPaginados = misElementos.slice(indexPrimer, indexUltimo);

        return (
          <div style={{
            background: "#f8fafc", 
            borderRadius: "24px", 
            padding: "28px", 
            marginTop: "24px",
            border: "1px solid #e2e8f0", 
            boxShadow: "0 4px 24px rgba(0, 0, 0, 0.02)"
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
                📂 Historial de mis Reportes y Propuestas
              </h2>
              <span style={{ 
                background: 'var(--primary)', 
                color: '#fff', 
                fontSize: '12px', 
                fontWeight: '800', 
                padding: '4px 10px', 
                borderRadius: '20px',
                boxShadow: '0 4px 10px rgba(122, 24, 53, 0.2)'
              }}>
                {misElementos.length} Total
              </span>
            </div>
            <p style={{ margin: "0 0 24px", fontSize: 13.5, color: "#64748b", lineHeight: 1.5 }}>
              Aquí puedes ver el estado actual de todas tus denuncias y sugerencias, incluyendo las resueltas y en espera de atención.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {reportesPaginados.length > 0 ? (
                reportesPaginados.map(rep => {
                  const badgeColor = 
                    rep.estado === 'completado' ? { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0', label: 'Completado' } :
                    rep.estado === 'en_reparacion' ? { bg: '#eff6ff', text: '#1d4ed8', border: '#dbeafe', label: 'En Progreso' } :
                    rep.estado === 'rechazado' ? { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca', label: 'Rechazado' } :
                    { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0', label: 'Pendiente' };

                  const icono = rep.tipo_incidencia === 'sugerencia' 
                    ? '💡' 
                    : (rep.problematica?.icono || ({ Bache: '🕳️', Semaforo: '🚦', Drenaje: '💧', Alumbrado: '💡', Puente: '🌉', Otro: '📋' }[rep.categoria] || '📋'));

                  return (
                    <div
                      key={rep.id}
                      onClick={() => setReporteSeleccionado(rep)}
                      style={{
                        display: "flex", 
                        flexDirection: "column",
                        background: "#ffffff", 
                        padding: "16px", 
                        borderRadius: "16px",
                        border: "1px solid #e2e8f0",
                        borderLeft: `4px solid ${badgeColor.text}`,
                        cursor: "pointer", 
                        boxShadow: "0 4px 6px -1px rgba(15, 23, 42, 0.03)",
                        transition: "all 0.2s ease",
                        gap: "10px"
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 8px 16px rgba(15, 23, 42, 0.06)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(15, 23, 42, 0.03)';
                      }}
                    >
                      {/* Fila superior: Icono y Título */}
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          background: '#f1f5f9',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.1rem',
                          flexShrink: 0
                        }}>
                          {icono}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: "#1e293b", lineHeight: '1.35', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {rep.titulo}
                          </h4>
                          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase' }}>
                            {rep.tipo_incidencia === 'sugerencia' ? '💡 Propuesta' : '📋 Denuncia'}
                          </span>
                        </div>
                      </div>

                      {/* Fila del medio: Dirección */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '12.5px', paddingLeft: '2px' }}>
                        <span style={{ fontSize: '13px', flexShrink: 0 }}>📍</span>
                        <span style={{ fontWeight: '600', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {rep.direccion || 'Dirección pendiente'}, {rep.municipio}
                        </span>
                      </div>

                      {/* Fila inferior: Estado y Flecha de detalles */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: "4px 10px", 
                          borderRadius: "20px", 
                          fontSize: "10px", 
                          fontWeight: "800",
                          letterSpacing: "0.5px",
                          background: badgeColor.bg, 
                          color: badgeColor.text, 
                          textTransform: "uppercase",
                          border: `1px solid ${badgeColor.border}`
                        }}>
                          <span style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            background: badgeColor.text,
                            display: 'inline-block'
                          }} />
                          {badgeColor.label}
                        </span>
                        <span style={{ fontSize: '12.5px', color: 'var(--primary)', fontWeight: '750', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          Detalles <span style={{ fontSize: '14px', lineHeight: 1 }}>›</span>
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: "center", padding: "2rem", background: "#ffffff", borderRadius: 16, border: "1px dashed #cbd5e1" }}>
                  <p style={{ margin: 0, color: "#64748b", fontWeight: 600 }}>Aún no has creado ningún reporte o propuesta.</p>
                </div>
              )}
            </div>

            {totalPaginas > 1 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginTop: '24px', 
                paddingTop: '20px', 
                borderTop: '1px solid #e2e8f0',
                gap: '8px'
              }}>
                <button 
                  disabled={paginaActual === 1}
                  onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                  style={{
                    flex: 1,
                    maxWidth: '100px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    background: paginaActual === 1 ? '#f1f5f9' : '#fff',
                    color: paginaActual === 1 ? '#94a3b8' : '#475569',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    cursor: paginaActual === 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                    boxShadow: paginaActual === 1 ? 'none' : '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                  onMouseOver={(e) => paginaActual !== 1 && (e.currentTarget.style.borderColor = 'var(--primary)', e.currentTarget.style.color = 'var(--primary)')}
                  onMouseOut={(e) => paginaActual !== 1 && (e.currentTarget.style.borderColor = '#cbd5e1', e.currentTarget.style.color = '#475569')}
                >
                  ← Ant.
                </button>
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#64748b', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  <strong style={{ color: '#1e293b' }}>{paginaActual}</strong> / {totalPaginas}
                </span>
                <button 
                  disabled={paginaActual === totalPaginas}
                  onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                  style={{
                    flex: 1,
                    maxWidth: '100px',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    background: paginaActual === totalPaginas ? '#f1f5f9' : '#fff',
                    color: paginaActual === totalPaginas ? '#94a3b8' : '#475569',
                    fontSize: '12.5px',
                    fontWeight: '700',
                    cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center',
                    boxShadow: paginaActual === totalPaginas ? 'none' : '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                  onMouseOver={(e) => paginaActual !== totalPaginas && (e.currentTarget.style.borderColor = 'var(--primary)', e.currentTarget.style.color = 'var(--primary)')}
                  onMouseOut={(e) => paginaActual !== totalPaginas && (e.currentTarget.style.borderColor = '#cbd5e1', e.currentTarget.style.color = '#475569')}
                >
                  Sig. →
                </button>
              </div>
            )}
          </div>
        );
      })()}

      <div style={{
        background: "#fff", borderRadius: 24, padding: "32px", marginTop: 24,
        border: "1px solid #fecaca", boxShadow: "0 4px 24px rgba(0,0,0,0.04)"
      }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: "#dc2626" }}>
          ⚠️ Zona de Peligro
        </h2>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
          Al solicitar la baja de tu cuenta, esta será desactivada permanentemente. No podrás acceder al sistema hasta que un administrador la reactive.
        </p>
        <button onClick={() => setModalBaja(true)} style={{
          padding: "12px 24px", borderRadius: 12, border: "none",
          background: "linear-gradient(135deg, #ef4444, #dc2626)",
          color: "#fff", fontWeight: 700, fontSize: 14,
          cursor: "pointer", transition: "all 0.2s",
          boxShadow: "0 4px 12px rgba(239,68,68,0.25)"
        }}>
          🚫 Solicitar Baja de Cuenta
        </button>
      </div>

      {modalBaja && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 10000,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "fadeIn 0.2s ease"
        }}>
          <div style={{
            background: "#fff", borderRadius: 24, padding: "36px", width: "100%", maxWidth: 440,
            boxShadow: "0 25px 50px rgba(0,0,0,0.2)",
            animation: "slideUp 0.35s cubic-bezier(0.16,1,0.3,1)"
          }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 20, fontWeight: 800, color: "#dc2626" }}>
              ⚠️ Confirmar Baja
            </h3>
            <p style={{ margin: "0 0 20px", fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
              Esta acción desactivará tu cuenta. Escribe el motivo de tu solicitud (mínimo 10 caracteres).
            </p>
            <textarea
              value={motivoBaja}
              onChange={e => setMotivoBaja(e.target.value)}
              placeholder="Escribe el motivo de la baja..."
              rows={4}
              style={{
                width: "100%", padding: "14px 16px", borderRadius: 14,
                border: "1px solid #e2e8f0", fontSize: 14, fontFamily: "'Inter', sans-serif",
                resize: "vertical", outline: "none", boxSizing: "border-box",
                transition: "border-color 0.2s"
              }}
              onFocus={e => e.target.style.borderColor = "#3b82f6"}
              onBlur={e => e.target.style.borderColor = "#e2e8f0"}
            />
            <div style={{ fontSize: 12, color: motivoBaja.trim().length < 10 ? "#94a3b8" : "#10b981", marginTop: 6, fontWeight: 600 }}>
              {motivoBaja.trim().length}/10 caracteres mínimos
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
              <button onClick={() => { setModalBaja(false); setMotivoBaja(""); }} disabled={procesandoBaja} style={{
                padding: "12px 24px", borderRadius: 12, border: "1px solid #e2e8f0",
                background: "#f8fafc", color: "#64748b", fontWeight: 700, fontSize: 14,
                cursor: "pointer"
              }}>
                Cancelar
              </button>
              <button onClick={confirmarBaja} disabled={procesandoBaja || motivoBaja.trim().length < 10} style={{
                padding: "12px 24px", borderRadius: 12, border: "none",
                background: procesandoBaja ? "#fca5a5" : "#ef4444",
                color: "#fff", fontWeight: 700, fontSize: 14,
                cursor: procesandoBaja ? "not-allowed" : "pointer",
                opacity: motivoBaja.trim().length < 10 ? 0.5 : 1,
                transition: "all 0.2s"
              }}>
                {procesandoBaja ? "Procesando..." : "Confirmar Baja"}
              </button>
            </div>
          </div>
        </div>
      )}

      {reporteSeleccionado && (
        <ModalDetalleReporte
          reporte={reporteSeleccionado}
          alCerrar={() => setReporteSeleccionado(null)}
          alEditar={abrirEditar}
          alEliminar={borrarReporte}
          alCambiarFirma={actualizarFirmaLocal}
          alPagar={(rep) => {
            setReporteSeleccionado(null);
            setDenunciaPago(rep);
          }}
          usuarioId={sesion?.user?.id}
        />
      )}

      {modalFormularioAbierto && (
        <ModalFormularioReporte
          abierto={modalFormularioAbierto}
          modo={modoFormulario}
          reporteInicial={reporteEnEdicion}
          alCerrar={() => setModalFormularioAbierto(false)}
          alGuardar={guardarReporte}
        />
      )}

      <PaymentModal
        abierto={Boolean(denunciaPago)}
        denuncia={denunciaPago}
        alCerrar={() => setDenunciaPago(null)}
        alExito={async () => {
          await cargarReportes();
          await cargarSugerencias();
          setDenunciaPago(null);
          mostrarToast("¡Incidencia destacada con éxito!");
        }}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}} />
    </div>
  );
}
