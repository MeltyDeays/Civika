import { useMemo, useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../modules/auth/controllers/useAuth.jsx";
import { useReportesAdminEntidad } from "../Controladores/useReportesAdminEntidad";
import RepairOrderModal from "../../../modals/RepairOrderModal";
import FalseReportModal from "../../../modals/FalseReportModal";
import { agregarAlTablero, obtenerIdsEnTablero } from "../../../services/kanbanService";
import { DEPARTAMENTOS_NICARAGUA } from "../../../utils/constants";
import { formatearFecha } from "../../../utils/formatters";
import { exportarCSV, toggleVisibilidad } from "../../../services/reportService";

const PRIORIDAD_ESTILOS = {
  critica: { color: '#ef4444', bg: '#fef2f2', label: 'Crítica' },
  alta: { color: '#f59e0b', bg: '#fff7ed', label: 'Alta' },
  media: { color: '#3b82f6', bg: '#eff6ff', label: 'Media' },
  baja: { color: '#10b981', bg: '#ecfdf5', label: 'Baja' },
};

const ESTADO_ESTILOS = {
  pendiente: { label: 'Pendiente', color: '#f97316', bg: '#fff7ed' },
  en_reparacion: { label: 'En Progreso', color: '#3b82f6', bg: '#eff6ff' },
  completado: { label: 'Completado', color: '#10b981', bg: '#ecfdf5' },
  rechazado: { label: 'Rechazado', color: '#ef4444', bg: '#fef2f2' },
};

const CATEGORIA_ICONOS = {
  Bache: '🕳️', Semaforo: '🚦', Drenaje: '💧', Alumbrado: '💡', Puente: '🌉', Otro: '📋'
};

export default function AdminEntidadReportesView() {
  const { perfil } = useAuth();
  const { items, setItems, reportando, reportarFalso, cargar } = useReportesAdminEntidad();
  const [busqueda, setBusqueda] = useState("");
  const [filtroDep, setFiltroDep] = useState("todos");
  const [filtroUrgencia, setFiltroUrgencia] = useState("todas");
  const [tabActivo, setTabActivo] = useState("infraestructura"); // infraestructura | sugerencias
  const [expandido, setExpandido] = useState(null);
  const [denunciaOrden, setDenunciaOrden] = useState(null);
  const [denunciaFalsa, setDenunciaFalsa] = useState(null);
  const [enTablero, setEnTablero] = useState({});
  const [agregando, setAgregando] = useState("");

  useEffect(() => {
    obtenerIdsEnTablero().then(mapa => setEnTablero(mapa));
  }, []);

  const manejarAgregarTablero = useCallback(async (item) => {
    setAgregando(item.id);
    try {
      const res = await agregarAlTablero(item.id, perfil?.id_entidad);
      if (res.error) {
        alert(res.error);
      } else {
        setEnTablero(prev => ({ ...prev, [item.id]: true }));
      }
    } catch (e) {
      alert(e.message);
    } finally {
      setAgregando("");
    }
  }, [perfil?.id_entidad]);

  const manejarAlternarVisibilidad = useCallback(async (item) => {
    try {
      // Si es_visible es false, queremos ponerlo en true. Si es true o null, queremos ponerlo en false.
      const nuevoEstado = item.es_visible === false ? true : false;
      const nuevo = await toggleVisibilidad(item.id, nuevoEstado);
      
      setItems(prev => prev.map(r => r.id === item.id ? { ...r, es_visible: nuevo.es_visible } : r));
    } catch (e) {
      alert("Error al cambiar visibilidad: " + e.message);
    }
  }, [setItems]);

  const filtrados = useMemo(() => {
    const ahora = Date.now();
    const OCHO_HORAS_MS = 8 * 60 * 60 * 1000;

    return items.filter((item) => {
      // Auto-ocultar completados de más de 8 horas
      if (item.estado === 'completado' && item.actualizado_el) {
        const tiempoTranscurrido = ahora - new Date(item.actualizado_el).getTime();
        if (tiempoTranscurrido > OCHO_HORAS_MS) return false;
      }

      const coincideBusqueda = item.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
                               item.descripcion?.toLowerCase().includes(busqueda.toLowerCase());
      const coincideDep = filtroDep === "todos" || item.departamento === filtroDep;
      const coincideUrgencia = filtroUrgencia === "todas" || 
        (item.urgencia || item.prioridad) === filtroUrgencia;
      return coincideBusqueda && coincideDep && coincideUrgencia;
    });
  }, [items, busqueda, filtroDep, filtroUrgencia]);

  const conteoInfra = items.length;
  const conteoSugerencias = 0; // placeholder - sugerencias are in another module

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <section style={{ padding: isMobile ? '12px 16px' : '28px 32px', background: '#f1f5f9', minHeight: '100%', paddingBottom: '4rem' }}>
      {/* Header */}
      <div style={{ 
        marginBottom: '24px', 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', 
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'stretch' : 'center',
        gap: isMobile ? '12px' : '1.5rem'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: isMobile ? '22px' : '28px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>
            Gestión de Reportes
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: isMobile ? '12px' : '14px', fontWeight: '500' }}>
            Revisa y gestiona todas las denuncias ciudadanas. Puedes agregar cualquiera al tablero de proyectos.
          </p>
        </div>
        <button
          onClick={() => exportarCSV(filtrados)}
          style={{
            padding: '10px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: '700',
            cursor: 'pointer', border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a',
            display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            justifyContent: 'center', width: isMobile ? '100%' : 'auto'
          }}
        >
          📥 Exportar CSV
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setTabActivo("infraestructura")}
          style={{
            padding: '10px 20px', borderRadius: '20px', fontSize: '13px', fontWeight: '700',
            cursor: 'pointer', transition: 'all 0.2s', border: 'none',
            background: tabActivo === "infraestructura"
              ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : '#fff',
            color: tabActivo === "infraestructura" ? '#fff' : '#64748b',
            boxShadow: tabActivo === "infraestructura" ? '0 4px 12px rgba(37,99,235,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
            flex: isMobile ? '1' : 'none',
            whiteSpace: 'nowrap'
          }}
        >
          🏗️ Infraestructura ({conteoInfra})
        </button>
        <button
          onClick={() => setTabActivo("sugerencias")}
          style={{
            padding: '10px 20px', borderRadius: '20px', fontSize: '13px', fontWeight: '700',
            cursor: 'pointer', transition: 'all 0.2s', border: 'none',
            background: tabActivo === "sugerencias"
              ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' : '#fff',
            color: tabActivo === "sugerencias" ? '#fff' : '#64748b',
            boxShadow: tabActivo === "sugerencias" ? '0 4px 12px rgba(139,92,246,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
            flex: isMobile ? '1' : 'none',
            whiteSpace: 'nowrap'
          }}
        >
          💡 Sugerencias & Reformas ({conteoSugerencias})
        </button>
      </div>

      {/* Filters Bar */}
      <div className="toolbar-premium" style={{
        marginBottom: '16px',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, borderBottom: isMobile ? '1px solid #e2e8f0' : 'none', paddingBottom: isMobile ? '8px' : '0' }}>
          <span style={{ color: '#94a3b8', fontSize: '16px' }}>🔍</span>
          <input
            style={{
              flex: 1, padding: '6px 0', border: 'none', outline: 'none',
              fontSize: '14px', color: '#334155', fontWeight: '500',
              background: 'transparent'
            }}
            placeholder="Buscar..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <select
          className="minimal-select"
          style={{
            padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0',
            background: '#f8fafc', fontWeight: '600', color: '#475569', fontSize: '13px',
            width: isMobile ? '100%' : 'auto'
          }}
          value={filtroDep}
          onChange={(e) => setFiltroDep(e.target.value)}
        >
          <option value="todos">Todos los departamentos</option>
          {Object.keys(DEPARTAMENTOS_NICARAGUA).map(dep => (
            <option key={dep} value={dep}>{dep}</option>
          ))}
        </select>
        <select
          className="minimal-select"
          style={{
            padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0',
            background: '#f8fafc', fontWeight: '600', color: '#475569', fontSize: '13px',
            width: isMobile ? '100%' : 'auto'
          }}
          value={filtroUrgencia}
          onChange={(e) => setFiltroUrgencia(e.target.value)}
        >
          <option value="todas">Toda urgencia</option>
          <option value="critica">Crítica</option>
          <option value="alta">Alta</option>
          <option value="media">Media</option>
          <option value="baja">Baja</option>
        </select>
      </div>

      {/* Count */}
      <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '600', marginBottom: '12px' }}>
        {filtrados.length} reportes encontrados
      </div>

      {/* Reports List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {filtrados.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '4rem', background: '#fff',
            borderRadius: '16px', border: '1px dashed #cbd5e1', color: '#64748b'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
            <h3 style={{ margin: 0 }}>No se encontraron reportes</h3>
          </div>
        ) : (
          filtrados.map((item, index) => {
            const prio = PRIORIDAD_ESTILOS[item.urgencia || item.prioridad] || PRIORIDAD_ESTILOS.media;
            const estado = ESTADO_ESTILOS[item.estado] || ESTADO_ESTILOS.pendiente;
            const catIcon = item.problematica?.icono || CATEGORIA_ICONOS[item.categoria] || '📋';
            const catName = item.problematica?.nombre || item.categoria || 'Otro';
            const isExpanded = expandido === item.id;
            const isFirst = index === 0 && !expandido;

            return (
              <article
                key={item.id}
                onClick={() => setExpandido(isExpanded ? null : item.id)}
                style={{
                  background: '#fff', borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden', cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: (isExpanded || isFirst) ? '0 4px 12px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.02)'
                }}
              >
                {/* Main row */}
                <div style={{
                  padding: isMobile ? '12px' : '16px 20px',
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'stretch' : 'center',
                  gap: isMobile ? '10px' : '14px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, overflow: 'hidden' }}>
                    {/* Thumbnail */}
                    <div style={{
                      width: isMobile ? '40px' : '48px', height: isMobile ? '40px' : '48px', borderRadius: '10px',
                      overflow: 'hidden', flexShrink: 0, background: '#f1f5f9'
                    }}>
                      {item.url_imagen ? (
                        <img src={item.url_imagen} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{
                          width: '100%', height: '100%', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? '16px' : '20px'
                        }}>
                          {catIcon}
                        </div>
                      )}
                    </div>

                    {/* Title & Location */}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{
                        fontSize: isMobile ? '13px' : '14px', fontWeight: '700', color: '#0f172a',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                      }}>
                        {item.titulo}
                      </div>
                      <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#94a3b8', fontWeight: '500', marginTop: '3px' }}>
                        📍 {item.direccion || item.municipio}, {item.municipio}
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div style={{ 
                    display: 'flex', 
                    gap: '6px', 
                    alignItems: 'center', 
                    flexWrap: 'wrap',
                    flexShrink: 0,
                    justifyContent: isMobile ? 'flex-start' : 'flex-end',
                    borderTop: isMobile ? '1px solid #f1f5f9' : 'none',
                    paddingTop: isMobile ? '8px' : '0'
                  }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '6px', fontSize: '11px',
                      fontWeight: '700', background: '#f1f5f9', color: '#475569',
                      display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                      {catIcon} {catName}
                    </span>
                    <span style={{
                      padding: '4px 10px', borderRadius: '6px', fontSize: '11px',
                      fontWeight: '700', background: prio.bg, color: prio.color
                    }}>
                      ● {prio.label}
                    </span>
                    <span style={{
                      padding: '4px 10px', borderRadius: '6px', fontSize: '11px',
                      fontWeight: '700', background: estado.bg, color: estado.color
                    }}>
                      {estado.label}
                    </span>
                    <span style={{
                      fontSize: '12px', color: '#94a3b8', fontWeight: '600',
                      display: 'flex', alignItems: 'center', gap: '4px',
                      marginLeft: isMobile ? 'auto' : '0'
                    }}>
                      ✍️ {item.firmas || 0}
                    </span>
                    <span style={{ color: '#cbd5e1', fontSize: '14px', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
                  </div>
                </div>

                {/* Expanded content */}
                {(isExpanded || isFirst) && (
                  <div style={{
                    padding: isMobile ? '0 12px 12px' : '0 20px 16px', borderTop: '1px solid #f1f5f9'
                  }}
                  onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ padding: '12px 0', display: 'flex', gap: '20px' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
                          {item.descripcion}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>
                          <span>📅 {formatearFecha(item.creado_el)}</span>
                          <span>👤 {item.perfiles?.nombre_completo || 'Ciudadano'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      flexDirection: isMobile ? 'column' : 'row',
                      justifyContent: 'flex-end',
                      width: '100%' 
                    }}>
                      {item.es_falso_reporte ? (
                        <span style={{
                          padding: '10px 20px', borderRadius: '10px', fontSize: '13px',
                          fontWeight: '700', border: '1px solid #cbd5e1',
                          background: '#f1f5f9', color: '#64748b', display: 'inline-flex',
                          alignItems: 'center', gap: '6px', justifyContent: 'center'
                        }}>
                          ⚠️ Reportado
                        </span>
                      ) : (
                        <button
                          onClick={() => setDenunciaFalsa(item)}
                          style={{
                            padding: '10px 20px', borderRadius: '10px', fontSize: '13px',
                            fontWeight: '700', cursor: 'pointer', border: '1px solid #fee2e2',
                            background: '#fef2f2', color: '#ef4444', transition: 'all 0.2s',
                            width: isMobile ? '100%' : 'auto', textAlign: 'center'
                          }}
                        >
                          ⚠️ Reportar Falso
                        </button>
                      )}
                      <button
                        onClick={() => manejarAlternarVisibilidad(item)}
                        style={{
                          padding: '10px 20px', borderRadius: '10px', fontSize: '13px',
                          fontWeight: '700', cursor: 'pointer',
                          borderWidth: '1px', borderStyle: 'solid',
                          borderColor: item.es_visible === false ? '#fee2e2' : '#e2e8f0',
                          background: item.es_visible === false ? '#fef2f2' : '#f8fafc', 
                          color: item.es_visible === false ? '#ef4444' : '#475569', transition: 'all 0.2s',
                          width: isMobile ? '100%' : 'auto', textAlign: 'center'
                        }}
                      >
                        {item.es_visible === false ? '👁️ Oculto (Mostrar)' : '👁️ Ocultar del Público'}
                      </button>
                      <button
                        disabled={enTablero[item.id] || agregando === item.id}
                        onClick={() => manejarAgregarTablero(item)}
                        style={{
                          padding: '10px 20px', borderRadius: '10px', fontSize: '13px',
                          fontWeight: '700', cursor: enTablero[item.id] ? 'default' : 'pointer',
                          border: 'none', transition: 'all 0.2s',
                          background: enTablero[item.id] ? '#ecfdf5' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                          color: enTablero[item.id] ? '#10b981' : '#fff',
                          boxShadow: enTablero[item.id] ? 'none' : '0 4px 12px rgba(37,99,235,0.3)',
                          width: isMobile ? '100%' : 'auto', textAlign: 'center'
                        }}
                      >
                        {enTablero[item.id] ? '✅ En Tablero' : agregando === item.id ? '⏳...' : '+ Agregar Proyecto'}
                      </button>
                      <button
                        style={{
                          padding: '10px 20px', borderRadius: '10px', fontSize: '13px',
                          fontWeight: '700', cursor: 'pointer', border: '1px solid #e2e8f0',
                          background: '#fff', color: '#475569', transition: 'all 0.2s',
                          width: isMobile ? '100%' : 'auto', textAlign: 'center'
                        }}
                        onClick={() => setDenunciaOrden(item)}
                      >
                        📋 Ver en Tablero
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      <RepairOrderModal
        abierto={Boolean(denunciaOrden)}
        entidadId={perfil?.id_entidad}
        tecnicoId={perfil?.id || null}
        denuncia={denunciaOrden}
        alCerrar={() => setDenunciaOrden(null)}
        alConfirmar={cargar}
      />
      <FalseReportModal
        abierto={Boolean(denunciaFalsa)}
        cargando={reportando}
        alCerrar={() => setDenunciaFalsa(null)}
        alConfirmar={async ({ motivo, pruebas }) => {
          const res = await reportarFalso(denunciaFalsa.id, denunciaFalsa.id_ciudadano, motivo, pruebas);
          if (res && res.success) {
            setDenunciaFalsa(null);
          }
        }}
      />
    </section>
  );
}
