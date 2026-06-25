import { useMemo, useState } from "react";
import ModalDetalleReporte from "../../../modals/ReportDetailModal";
import ModalFormularioReporte from "../../../modals/ReportFormModal";
import PaymentModal from "../../../modals/PaymentModal";
import { formatearFecha } from "../../../utils/formatters";
import { useDenunciasCiudadano } from "../Controladores/useDenunciasCiudadano";
import { useAuth } from "../../../modules/auth/controllers/useAuth.jsx";
import { DEPARTAMENTOS_NICARAGUA } from "../../../utils/constants";

export default function CiudadanoReportesView() {
  const { vincularCodigoTecnico, sesion } = useAuth();
  const { reportes, crear, actualizar, eliminar, actualizarFirmaLocal, cargarReportes } = useDenunciasCiudadano();
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroDep, setFiltroDep] = useState("todos");
  const [filtroUrgencia, setFiltroUrgencia] = useState("todos");
  const [tabFeed, setTabFeed] = useState("comunidad"); // "comunidad" o "mis_reportes"
  
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);
  const [modalFormularioAbierto, setModalFormularioAbierto] = useState(false);
  const [modoFormulario, setModoFormulario] = useState("crear");
  const [reporteEnEdicion, setReporteEnEdicion] = useState(null);
  const [denunciaPago, setDenunciaPago] = useState(null);
  const [vincularCodigoAbierto, setVincularCodigoAbierto] = useState(false);
  const [codigoVinculacion, setCodigoVinculacion] = useState("");

  const reportesFiltrados = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const ahora = Date.now();
    const OCHO_HORAS_MS = 8 * 60 * 60 * 1000;

    return reportes.filter((item) => {
      const esDuenio = item.id_ciudadano === sesion?.user?.id;

      if (tabFeed === "mis_reportes") {
        // En mis reportes solo veo mis propios reportes sin importar visibilidad
        if (!esDuenio) return false;
      } else {
        // En comunidad
        // 1. Visibilidad manual (H017)
        if (!esDuenio && item.es_visible === false) return false;

        // 2. Auto-ocultado automático (Completados > 8h)
        if (item.estado === 'completado' && item.actualizado_el) {
          const tiempoTranscurrido = ahora - new Date(item.actualizado_el).getTime();
          if (tiempoTranscurrido > OCHO_HORAS_MS) return false;
        }
      }

      const coincideBusqueda = item.titulo.toLowerCase().includes(busqueda.toLowerCase());
      const coincideEstado = filtroEstado === "todos" || item.estado === filtroEstado;
      const coincideDep = filtroDep === "todos" || item.departamento === filtroDep;
      const coincideUrgencia = filtroUrgencia === "todos" || item.urgencia === filtroUrgencia;
      return coincideBusqueda && coincideEstado && coincideDep && coincideUrgencia;
    });
  }, [reportes, tabFeed, busqueda, filtroEstado, filtroDep, filtroUrgencia, sesion?.user?.id]);

  const estadisticas = useMemo(() => {
    const total = reportes.length;
    const criticos = reportes.filter((item) => item.urgencia === "critica").length;
    const enProgreso = reportes.filter((item) => item.estado === "en_reparacion").length;
    const completados = reportes.filter((item) => item.estado === "completado").length;
    return { total, criticos, enProgreso, completados };
  }, [reportes]);

  const abrirCrear = () => {
    setModoFormulario("crear");
    setReporteEnEdicion(null);
    setModalFormularioAbierto(true);
  };

  const abrirEditar = (reporte) => {
    setModoFormulario("editar");
    setReporteEnEdicion(reporte);
    setModalFormularioAbierto(true);
  };

  const guardarReporte = async (payload) => {
    try {
      if (modoFormulario === "editar" && reporteEnEdicion?.id) {
        const actualizado = await actualizar(reporteEnEdicion.id, payload);
        setReporteSeleccionado(actualizado);
        setModalFormularioAbierto(false);
        return;
      }
      await crear(payload);
      setModalFormularioAbierto(false);
    } catch (error) {
      if (error.message.includes("[DUPLICADO_DETECTADO]")) {
        const msgLimpio = error.message.replace("[DUPLICADO_DETECTADO]", "").trim();
        alert(msgLimpio);
      } else {
        alert("Ocurrió un error al guardar el reporte: " + error.message);
      }
    }
  };

  const borrarReporte = async (reporte) => {
    await eliminar(reporte.id);
    setReporteSeleccionado(null);
  };

  const manejarVincular = () => {
    setCodigoVinculacion("");
    setVincularCodigoAbierto(true);
  };

  const procesarVincularCodigo = async () => {
    if (!codigoVinculacion.trim()) return;
    try {
      await vincularCodigoTecnico(codigoVinculacion.trim().toUpperCase());
      alert("¡Felicidades! Tu cuenta ha sido ascendida a Técnico. Recargando la página...");
      window.location.reload();
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const getStatusLabel = (estado) => {
    switch(estado) {
      case 'pendiente': return 'Pendiente';
      case 'en_reparacion': return 'En Reparación';
      case 'completado': return 'Completado';
      case 'rechazado': return 'Rechazado';
      default: return estado;
    }
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <section style={{ paddingBottom: '3rem' }}>
      {/* Header Estilo Banner Premium */}
      <div className="citizen-banner network-nodes-bg">
        <div>
          <h1>Reportes Ciudadanos</h1>
          <p>Ayuda a mejorar tu comunidad reportando problemas en la infraestructura</p>
        </div>
        <div className="citizen-banner-actions">
          <button onClick={manejarVincular} style={{ 
            background: 'rgba(255,255,255,0.1)', 
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            padding: '10px 16px',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: '600',
            backdropFilter: 'blur(10px)',
            textAlign: 'center'
          }}>
            💼 Vincular Código
          </button>
          <button onClick={abrirCrear} style={{ 
            background: '#fff', 
            color: 'var(--primary)',
            border: '1px solid rgba(122, 24, 53, 0.15)',
            padding: '10px 24px',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: '700',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            📝 Nueva Denuncia
          </button>
        </div>
      </div>

      {/* Grid de Estadísticas con Estilo del Diseño */}
      <div className="citizen-stats-grid">
        <div className="citizen-stat-card">
          <div className="citizen-stat-val total">{estadisticas.total}</div>
          <div className="citizen-stat-label total">Total Reportes</div>
        </div>
        <div className="citizen-stat-card critical">
          <div className="citizen-stat-val critical">{estadisticas.criticos}</div>
          <div className="citizen-stat-label critical">Urgencia Crítica</div>
        </div>
        <div className="citizen-stat-card progress">
          <div className="citizen-stat-val progress">{estadisticas.enProgreso}</div>
          <div className="citizen-stat-label progress">En Progreso</div>
        </div>
        <div className="citizen-stat-card completed">
          <div className="citizen-stat-val completed">{estadisticas.completados}</div>
          <div className="citizen-stat-label completed">Completados</div>
        </div>
      </div>

      {/* Selector de Feed */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setTabFeed("comunidad")}
          style={{
            padding: '10px 20px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '700',
            cursor: 'pointer', transition: 'all 0.2s',
            background: tabFeed === "comunidad" ? 'var(--primary)' : '#fff',
            color: tabFeed === "comunidad" ? '#fff' : '#64748b',
            border: '1px solid',
            borderColor: tabFeed === "comunidad" ? 'var(--primary)' : '#eef2f6',
            boxShadow: tabFeed === "comunidad" ? '0 4px 12px var(--primary-glow)' : 'none'
          }}
        >
          🌐 Reportes de la Comunidad
        </button>
        <button
          onClick={() => setTabFeed("mis_reportes")}
          style={{
            padding: '10px 20px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '700',
            cursor: 'pointer', transition: 'all 0.2s',
            background: tabFeed === "mis_reportes" ? 'var(--primary)' : '#fff',
            color: tabFeed === "mis_reportes" ? '#fff' : '#64748b',
            border: '1px solid',
            borderColor: tabFeed === "mis_reportes" ? 'var(--primary)' : '#eef2f6',
            boxShadow: tabFeed === "mis_reportes" ? '0 4px 12px var(--primary-glow)' : 'none'
          }}
        >
          📂 Mis Reportes (Historial)
        </button>
      </div>

      {/* Toolbar con Filtros Avanzados */}
      <div className="toolbar-premium" style={{ marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
          <input
            style={{ paddingLeft: '36px', border: '1px solid #e2e8f0', borderRadius: '10px', height: '42px', width: '100%' }}
            placeholder="Buscar reportes..."
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
          />
        </div>
        <select className="minimal-select" style={{ height: '42px', minWidth: '180px' }} value={filtroDep} onChange={(e) => setFiltroDep(e.target.value)}>
          <option value="todos">Todos los departamentos</option>
          {Object.keys(DEPARTAMENTOS_NICARAGUA).map(dep => <option key={dep} value={dep}>{dep}</option>)}
        </select>
        <select className="minimal-select" style={{ height: '42px', minWidth: '140px' }} value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="todos">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_reparacion">En progreso</option>
          <option value="completado">Completado</option>
        </select>
        <select className="minimal-select" style={{ height: '42px', minWidth: '140px' }} value={filtroUrgencia} onChange={(e) => setFiltroUrgencia(e.target.value)}>
          <option value="todos">Todas las urgencias</option>
          <option value="baja">Baja</option>
          <option value="media">Media</option>
          <option value="alta">Alta</option>
          <option value="critica">Crítica</option>
        </select>
      </div>

      <div style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem', fontWeight: '600' }}>
        🔍 {reportesFiltrados.length} resultados encontrados
      </div>

      {/* Grid de Cards Estilo Instagram/Figma */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: isMobile ? '1rem' : '2rem' }}>
        {reportesFiltrados.map((item) => (
          <article key={item.id} style={{ 
            background: '#fff', 
            borderRadius: '20px', 
            overflow: 'hidden', 
            border: '1px solid #eef2f6',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            transition: 'transform 0.2s',
            cursor: 'pointer'
          }}
          onClick={() => setReporteSeleccionado(item)}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            {/* Imagen con Badges */}
            <div style={{ position: 'relative', height: '200px' }}>
              <img 
                src={item.url_imagen || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='200' fill='%23f1f5f9'%3E%3Crect width='400' height='200'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2394a3b8'%3ESin Imagen%3C/text%3E%3C/svg%3E"} 
                alt={item.titulo} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
              <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px' }}>
                <span style={{ 
                  background: item.urgencia === 'critica' ? '#fee2e2' : '#fef3c7', 
                  color: item.urgencia === 'critica' ? '#ef4444' : '#d97706',
                  padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'capitalize'
                }}>
                  ● {item.urgencia}
                </span>
              </div>
              <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                <span style={{ 
                  background: 'rgba(255,255,255,0.9)', color: '#1e293b',
                  padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  🕒 {getStatusLabel(item.estado)}
                </span>
              </div>
            </div>

            {/* Contenido Card */}
            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '1.2rem' }}>
                  {item.problematica?.icono || ({ Bache: '🕳️', Semaforo: '🚦', Drenaje: '💧', Alumbrado: '💡', Puente: '🌉', Otro: '📋' }[item.categoria] || '📋')}
                </span>
                <span style={{ color: '#64748b', fontWeight: '700', fontSize: '0.85rem', textTransform: 'uppercase' }}>{item.categoria}</span>
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', color: '#0f172a', fontWeight: '700', lineHeight: 1.4 }}>{item.titulo}</h3>
              <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                {item.descripcion}
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.8rem', marginBottom: '16px' }}>
                <span>📍</span>
                <span style={{ fontWeight: '500' }}>{item.direccion}, {item.municipio}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: '600' }}>{formatearFecha(item.creado_el)}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ background: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700' }}>
                    ✍️ {item.firmas || 0}
                  </span>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

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
      <ModalFormularioReporte
        abierto={modalFormularioAbierto}
        modo={modoFormulario}
        reporteInicial={reporteEnEdicion}
        alCerrar={() => setModalFormularioAbierto(false)}
        alGuardar={guardarReporte}
      />
      <PaymentModal
        abierto={Boolean(denunciaPago)}
        denuncia={denunciaPago}
        alCerrar={() => setDenunciaPago(null)}
        alExito={async () => {
          await cargarReportes();
          setDenunciaPago(null);
        }}
      />

      {/* Modal Premium de Vinculación de Código */}
      {vincularCodigoAbierto && (
        <div
          onClick={() => setVincularCodigoAbierto(false)}
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
              maxWidth: '440px', 
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
                💼 Vincular Código Técnico
              </h3>
              <button
                onClick={() => setVincularCodigoAbierto(false)}
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
                Ingresa el código de invitación proporcionado por tu entidad institucional (ej. <code>ENACAL-2026</code>) para ascender tu cuenta a Técnico.
              </p>
              <input
                type="text"
                value={codigoVinculacion}
                onChange={(e) => setCodigoVinculacion(e.target.value)}
                placeholder="Escribe el código aquí..."
                style={{
                  width: '100%', 
                  padding: '12px', 
                  borderRadius: '10px', 
                  border: '1px solid #cbd5e1', 
                  fontSize: '1rem',
                  outline: 'none',
                  fontWeight: '700',
                  color: '#1e293b',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  textAlign: 'center',
                  marginTop: '8px'
                }}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                onClick={() => setVincularCodigoAbierto(false)}
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
                onClick={procesarVincularCodigo}
                style={{
                  background: 'var(--primary)',
                  color: '#fff', 
                  border: 'none', 
                  padding: '10px 18px', 
                  borderRadius: '10px', 
                  fontWeight: '700', 
                  fontSize: '0.875rem', 
                  cursor: 'pointer', 
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 6px var(--primary-glow)'
                }}
              >
                Vincular
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
