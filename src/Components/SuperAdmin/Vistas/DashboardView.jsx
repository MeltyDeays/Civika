import { useState } from "react";
import { useEntidadesSuperAdmin } from "../Controladores/useEntidadesSuperAdmin";
import { useModeracionSuperAdmin } from "../Controladores/useModeracionSuperAdmin";
import { parsearPuntoGeo } from "../../../utils/formatters";

export default function SuperAdminDashboardView() {
  const { 
    entidades, 
    problematicas, 
    error: errorEntidades, 
    creando, 
    crearEntidad,
    eliminarEntidad,
    actualizarEntidad,
    crearProblematica, 
    eliminarProblematica,
    actualizarProblematica
  } = useEntidadesSuperAdmin();

  const {
    ciudadanos,
    strikesPendientes,
    error: errorMod,
    confirmarStrike,
    rechazarStrike,
    quitarStrike,
    registrarPagoMulta,
    condonarMulta,
    cambiarEstadoCuenta
  } = useModeracionSuperAdmin();

  const [tabActual, setTabActual] = useState("entidades"); // "entidades" | "problematicas" | "usuarios"
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [resolucionTexto, setResolucionTexto] = useState({});
  const [filtroCiudadano, setFiltroCiudadano] = useState("todos"); // todos | activos | suspendidos | baneados
  const [busquedaCiudadano, setBusquedaCiudadano] = useState("");
  
  // Estados para formulario de Entidad
  const [nombreEntidad, setNombreEntidad] = useState("");
  const [sectorEntidad, setSectorEntidad] = useState("");
  const [probsSeleccionadas, setProbsSeleccionadas] = useState([]);
  
  // Estados para formulario de Problemática
  const [nombreProb, setNombreProb] = useState("");
  const [descProb, setDescProb] = useState("");
  const [iconoProb, setIconoProb] = useState("📋");

  const [editandoProblematica, setEditandoProblematica] = useState(null);
  const [editNombreProb, setEditNombreProb] = useState("");
  const [editIconoProb, setEditIconoProb] = useState("");
  const [codigoGenerado, setCodigoGenerado] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [entidadEdicion, setEntidadEdicion] = useState(null);

  const handleCrearEntidad = async (e) => {
    e.preventDefault();
    if (probsSeleccionadas.length === 0) {
      alert("Debes seleccionar al menos 1 problemática.");
      return;
    }
    const res = await crearEntidad({ nombre: nombreEntidad, sector: sectorEntidad }, probsSeleccionadas);
    if (res.success) {
      setNombreEntidad("");
      setSectorEntidad("");
      setProbsSeleccionadas([]);
      setCodigoGenerado(res.codigo);
    } else {
      alert("Error: " + res.error);
    }
  };

  const handleCrearProblematica = async (e) => {
    e.preventDefault();
    const res = await crearProblematica({ nombre: nombreProb, descripcion: descProb, icono: iconoProb });
    if (res.success) {
      setNombreProb("");
      setDescProb("");
      setIconoProb("📋");
    } else {
      alert("Error al crear problemática: " + res.error);
    }
  };

  const toggleProbSelection = (id) => {
    setProbsSeleccionadas(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const formCompletoEntidad = nombreEntidad && sectorEntidad && probsSeleccionadas.length > 0;
  const formCompletoProb = nombreProb && descProb && iconoProb;

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <section style={{ padding: isMobile ? '1rem' : '2rem', background: '#f7f3f5', minHeight: '100%' }}>
      {/* Header Premium */}
      <header className="network-nodes-bg" style={{ 
        background: 'linear-gradient(135deg, var(--dark-sidebar-start) 0%, var(--primary) 100%)', 
        borderRadius: isMobile ? '16px' : '24px', 
        padding: isMobile ? '1.5rem' : '2rem', 
        color: '#fff',
        marginBottom: '2rem',
        boxShadow: '0 10px 15px -3px var(--primary-glow)'
      }}>
        <h1 style={{ margin: 0, fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: '800' }}>Panel Super Admin</h1>
        <p style={{ margin: '8px 0 0', opacity: 0.8, fontSize: isMobile ? '0.85rem' : '1rem' }}>Gestiona entidades institucionales y el catálogo global de problemáticas urbanas.</p>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setTabActual("entidades")}
          style={{
            flex: isMobile ? '1' : 'none',
            padding: '12px 20px', borderRadius: '12px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s',
            background: tabActual === "entidades" ? 'var(--primary)' : '#fff',
            color: tabActual === "entidades" ? '#fff' : '#64748b',
            border: tabActual === "entidades" ? '1px solid var(--primary)' : '1px solid #cbd5e1',
            boxShadow: tabActual === "entidades" ? '0 4px 6px var(--primary-glow)' : 'none'
          }}
        >
          🏢 Entidades
        </button>
        <button 
          onClick={() => setTabActual("problematicas")}
          style={{
            flex: isMobile ? '1' : 'none',
            padding: '12px 20px', borderRadius: '12px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s',
            background: tabActual === "problematicas" ? 'var(--primary)' : '#fff',
            color: tabActual === "problematicas" ? '#fff' : '#64748b',
            border: tabActual === "problematicas" ? '1px solid var(--primary)' : '1px solid #cbd5e1',
            boxShadow: tabActual === "problematicas" ? '0 4px 6px var(--primary-glow)' : 'none'
          }}
        >
          📋 Catálogo
        </button>
        <button 
          onClick={() => setTabActual("usuarios")}
          style={{
            flex: isMobile ? '1' : 'none',
            padding: '12px 20px', borderRadius: '12px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s',
            background: tabActual === "usuarios" ? 'var(--primary)' : '#fff',
            color: tabActual === "usuarios" ? '#fff' : '#64748b',
            border: tabActual === "usuarios" ? '1px solid var(--primary)' : '1px solid #cbd5e1',
            boxShadow: tabActual === "usuarios" ? '0 4px 6px var(--primary-glow)' : 'none'
          }}
        >
          👥 Moderación Usuarios
        </button>
      </div>

      {(errorEntidades || errorMod) ? (
        <div style={{ background: '#fef2f2', color: '#ef4444', padding: '16px', borderRadius: '12px', marginBottom: '2rem', fontWeight: '700' }}>
          Error: {errorEntidades || errorMod}
        </div>
      ) : null}

      {/* TAB ENTIDADES */}
      {tabActual === "entidades" && (
        <div style={{ display: 'flex', gap: '2rem', flexDirection: isMobile ? 'column' : 'row' }}>
          
          {/* Formulario Entidad */}
          <div style={{ flex: isMobile ? '1' : '0 0 350px' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '1rem' }}>Registrar Nueva Entidad</h3>
            <form onSubmit={handleCrearEntidad} style={{ background: '#fff', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Nombre de Entidad/Institución *</label>
                <input 
                  type="text" value={nombreEntidad} onChange={e => setNombreEntidad(e.target.value)} required 
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)', fontSize: '0.95rem' }} 
                  placeholder="Ej: ENACAL, Alcaldía de Managua"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Sector *</label>
                <select 
                  value={sectorEntidad} onChange={e => setSectorEntidad(e.target.value)} required
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)', fontSize: '0.95rem', background: '#fff' }}
                >
                  <option value="">Selecciona un sector...</option>
                  <option value="Público">Público</option>
                  <option value="Privado">Privado</option>
                  <option value="Mixto">Mixto</option>
                  <option value="ONG">ONG</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Problemáticas a Resolver *</label>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {problematicas.length === 0 ? <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No hay problemáticas creadas.</span> : null}
                  {problematicas.map(p => {
                    const isSelected = probsSeleccionadas.includes(p.id);
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => toggleProbSelection(p.id)}
                        style={{
                          padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
                          background: isSelected ? 'var(--primary-light)' : '#fff',
                          color: isSelected ? 'var(--primary)' : '#64748b',
                          border: isSelected ? '1px solid var(--primary-hover)' : '1px solid #cbd5e1'
                        }}
                      >
                        {p.icono || "📋"} {p.nombre}
                      </button>
                    )
                  })}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={creando || !formCompletoEntidad}
                style={{ 
                  marginTop: '0.5rem', padding: '14px', borderRadius: '12px', fontWeight: '800', fontSize: '1rem', border: 'none', transition: 'all 0.2s',
                  background: (!creando && formCompletoEntidad) ? 'var(--primary)' : '#cbd5e1',
                  color: '#fff', cursor: (!creando && formCompletoEntidad) ? 'pointer' : 'not-allowed',
                  boxShadow: (!creando && formCompletoEntidad) ? '0 4px 6px var(--primary-glow)' : 'none'
                }} 
              >
                {creando ? "Generando..." : "Crear Entidad y Generar Código"}
              </button>
            </form>
          </div>

          {/* Lista de Entidades */}
          <div style={{ flex: '1' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '1rem' }}>Entidades Registradas ({entidades.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {entidades.length ? (
                entidades.map((entidad) => {
                  const hasProbs = entidad.entidad_problematica && entidad.entidad_problematica.length > 0;
                  return (
                    <article key={entidad.id} style={{ background: '#fff', borderRadius: '20px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', position: 'relative' }}>
                      
                      <div style={{ position: 'absolute', top: isMobile ? '1rem' : '1.5rem', right: isMobile ? '1rem' : '1.5rem', display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => {
                            setEntidadEdicion({ id: entidad.id, nombre: entidad.nombre });
                          }}
                          style={{ background: '#f1f5f9', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', color: '#475569', cursor: 'pointer' }}
                        >{isMobile ? '✏️' : '✏️ Editar'}</button>
                        <button 
                          onClick={() => {
                            setConfirmConfig({
                              titulo: "Eliminar Entidad",
                              mensaje: `¿Seguro que deseas eliminar la entidad "${entidad.nombre}"? Esta acción no se puede deshacer.`,
                              tipo: "danger",
                              alConfirmar: () => eliminarEntidad(entidad.id)
                            });
                          }}
                          style={{ background: '#fef2f2', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', color: '#ef4444', cursor: 'pointer' }}
                        >🗑️</button>
                      </div>

                      <div style={{ marginBottom: '1rem', paddingRight: isMobile ? '60px' : '120px' }}>
                        <h3 style={{ margin: '0 0 4px', fontSize: isMobile ? '1.1rem' : '1.25rem', color: '#0f172a', fontWeight: '800' }}>{entidad.nombre}</h3>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: '500' }}>{entidad.sector || "Sin sector"}</p>
                      </div>
                      
                      <div style={{ marginBottom: '1.25rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Atiende:</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {!hasProbs && <span style={{ fontSize: '0.85rem', color: '#cbd5e1', fontStyle: 'italic' }}>Ninguna asignada</span>}
                          {hasProbs && entidad.entidad_problematica.map(ep => {
                            const p = problematicas.find(prob => prob.id === ep.problematica_id);
                            if(!p) return null;
                            return (
                              <span key={p.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>
                                {p.icono || "📋"} {p.nombre}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: '12px', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', flexDirection: isMobile ? 'column' : 'row' }}>
                        <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', backgroundColor: entidad.esta_usado ? '#dcfce7' : '#fef9c3', color: entidad.esta_usado ? '#166534' : '#854d0e' }}>
                          {entidad.esta_usado ? "🟢 En uso" : "🟡 Pendiente"}
                        </span>
                        <span style={{ background: '#f1f5f9', padding: '4px 12px', borderRadius: '8px', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.8rem', color: '#334155', width: isMobile ? '100%' : 'auto', textAlign: isMobile ? 'center' : 'left' }}>
                          CÓDIGO: {entidad.codigo_invitacion}
                        </span>
                      </div>
                    </article>
                  )
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: '20px', border: '1px dashed #cbd5e1' }}>
                  <p style={{ color: '#64748b', fontWeight: '600' }}>No hay entidades registradas todavía.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB PROBLEMÁTICAS */}
      {tabActual === "problematicas" && (
        <div style={{ display: 'flex', gap: '2rem', flexDirection: isMobile ? 'column' : 'row' }}>
          
          <div style={{ flex: isMobile ? '1' : '0 0 350px' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '1rem' }}>Crear Problemática</h3>
            <form onSubmit={handleCrearProblematica} style={{ background: '#fff', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: '80px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Icono</label>
                  <input 
                    type="text" value={iconoProb} onChange={e => setIconoProb(e.target.value)} required maxLength={2}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '1.2rem', textAlign: 'center' }} 
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Nombre del Problema *</label>
                  <input 
                    type="text" placeholder="Ej: Fuga de Agua" value={nombreProb} onChange={e => setNombreProb(e.target.value)} required 
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)', fontSize: '0.95rem' }} 
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>Descripción *</label>
                <textarea 
                  placeholder="Detalla qué abarca este problema..." value={descProb} onChange={e => setDescProb(e.target.value)} required rows={3}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)', fontSize: '0.95rem', resize: 'none' }} 
                />
              </div>
              
              <button 
                type="submit" 
                disabled={!formCompletoProb}
                style={{ 
                  marginTop: '0.5rem', padding: '14px', borderRadius: '12px', fontWeight: '800', fontSize: '1rem', border: 'none', transition: 'all 0.2s',
                  background: formCompletoProb ? '#10b981' : '#cbd5e1',
                  color: '#fff', cursor: formCompletoProb ? 'pointer' : 'not-allowed',
                  boxShadow: formCompletoProb ? '0 4px 6px rgba(16,185,129,0.2)' : 'none'
                }}
              >
                + Añadir al Catálogo
              </button>
            </form>
          </div>

          <div style={{ flex: '1' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '1rem' }}>Catálogo Actual ({problematicas.length})</h3>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {problematicas.length ? (
                problematicas.map((prob) => {
                  const isEditing = editandoProblematica === prob.id;
                  return (
                    <article key={prob.id} style={{ background: '#fff', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', marginBottom: '-4px' }}>Icono y Nombre</label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input 
                              type="text" value={editIconoProb} onChange={e => setEditIconoProb(e.target.value)} maxLength={2} 
                              style={{ width: '50px', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '1.1rem' }}
                            />
                            <input 
                              type="text" value={editNombreProb} onChange={e => setEditNombreProb(e.target.value)} 
                              style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '0.5rem' }}>
                            <button 
                              onClick={async () => {
                                if(!editNombreProb.trim()) return;
                                const res = await actualizarProblematica(prob.id, { nombre: editNombreProb, icono: editIconoProb });
                                if(res.success) setEditandoProblematica(null);
                                else alert("Error: " + res.error);
                              }} 
                              style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none', padding: '8px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                            >Guardar</button>
                            <button 
                              onClick={() => setEditandoProblematica(null)} 
                              style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '8px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
                            >Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', color: '#0f172a', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span>{prob.icono || "📋"}</span> {prob.nombre}
                            </h3>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', lineHeight: 1.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                              {prob.descripcion}
                            </p>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #f8fafc' }}>
                            <button 
                              onClick={() => {
                                setEditandoProblematica(prob.id);
                                setEditNombreProb(prob.nombre);
                                setEditIconoProb(prob.icono || "📋");
                              }}
                              style={{ flex: 1, background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', color: '#475569', cursor: 'pointer' }}
                            >✏️ Editar</button>
                            <button 
                              onClick={() => {
                                setConfirmConfig({
                                  titulo: "Eliminar Problemática",
                                  mensaje: `¿Seguro que quieres eliminar la problemática "${prob.nombre}"? Afectará a los reportes ligados.`,
                                  tipo: "danger",
                                  alConfirmar: async () => {
                                    const res = await eliminarProblematica(prob.id);
                                    if (!res.success) {
                                      alert("No se puede eliminar: tiene reportes asociados o ocurrió un error.\n\nDetalle técnico: " + res.error);
                                    }
                                  }
                                });
                              }}
                              style={{ background: '#fef2f2', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', color: '#ef4444', cursor: 'pointer' }}
                            >🗑️ Eliminar</button>
                          </div>
                        </>
                      )}
                    </article>
                  )
                })
              ) : (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: '20px', border: '1px dashed #cbd5e1' }}>
                  <p style={{ color: '#64748b', fontWeight: '600' }}>El catálogo está vacío.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB MODERACIÓN DE USUARIOS */}
      {tabActual === "usuarios" && (
        <div style={{ display: 'flex', gap: '2rem', flexDirection: isMobile ? 'column' : 'row' }}>
          
          {/* Bandeja de Strikes Pendientes */}
          <div style={{ flex: isMobile ? '1' : '1.2' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚠️ Denuncias Falsas Reportadas ({strikesPendientes.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {strikesPendientes.length ? (
                strikesPendientes.map((st) => {
                  const coords = parsearPuntoGeo(st.denuncia?.ubicacion);
                  return (
                    <article key={st.id} style={{ background: '#fff', borderRadius: '20px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '1rem' }}>
                        <div>
                          <span style={{ fontSize: '0.8rem', fontWeight: '800', background: '#fee2e2', color: '#ef4444', padding: '4px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                            Reportado por: {st.entidad?.nombre || "Entidad"}
                          </span>
                          <h4 style={{ margin: '8px 0 2px', fontSize: '1.1rem', color: '#0f172a', fontWeight: '800' }}>
                            Reporte: "{st.denuncia?.titulo}"
                          </h4>
                          <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
                            Ciudadano: <strong>{st.ciudadano?.nombre_completo}</strong> (Cédula: {st.ciudadano?.cedula})
                          </p>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' }}>
                          {new Date(st.creado_el).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Dirección del Reporte y Botón de Mapa */}
                      <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#475569' }}>
                          📍 <strong>Dirección:</strong> {st.denuncia?.direccion || "Sin dirección exacta"}, {st.denuncia?.municipio || ""}, {st.denuncia?.departamento || ""}
                        </p>
                        {coords && (
                          <div style={{ marginTop: '4px' }}>
                            <a
                              href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.8rem',
                                color: '#2563eb',
                                fontWeight: '700',
                                textDecoration: 'none',
                                padding: '6px 12px',
                                background: '#eff6ff',
                                borderRadius: '8px',
                                border: '1px solid #bfdbfe',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#dbeafe'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#eff6ff'}
                            >
                              🗺️ Ver ubicación en Google Maps
                            </a>
                          </div>
                        )}
                      </div>

                      <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                        <p style={{ margin: '0 0 6px', fontSize: '0.8rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                          Motivo de Falsedad (según Entidad):
                        </p>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: 1.5, fontStyle: 'italic' }}>
                          "{st.motivo}"
                        </p>
                        {st.pruebas_entidad && (
                          <div style={{ marginTop: '12px' }}>
                            <p style={{ margin: '0 0 6px', fontSize: '0.8rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>
                              Evidencia de la Entidad:
                            </p>
                            {st.pruebas_entidad.match(/\.(jpeg|jpg|gif|png|webp)/i) || st.pruebas_entidad.includes('supabase') ? (
                              <a
                                href={st.pruebas_entidad}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  display: 'inline-block',
                                  borderRadius: '12px',
                                  overflow: 'hidden',
                                  border: '1px solid #cbd5e1',
                                  transition: 'transform 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                              >
                                <img
                                  src={st.pruebas_entidad}
                                  alt="Evidencia cargada por la entidad"
                                  style={{ maxHeight: '160px', maxWidth: '100%', objectFit: 'contain', display: 'block' }}
                                />
                              </a>
                            ) : (
                              <p style={{ margin: 0, fontSize: '0.8rem', color: '#2563eb', wordBreak: 'break-all' }}>
                                🔗 Pruebas: <a href={st.pruebas_entidad} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: 'inherit' }}>{st.pruebas_entidad}</a>
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Resolución / Comentario del Super Admin (Opcional)"
                        value={resolucionTexto[st.id] || ""}
                        onChange={(e) => setResolucionTexto(prev => ({ ...prev, [st.id]: e.target.value }))}
                        style={{
                          width: '100%', padding: '10px', borderRadius: '10px',
                          border: '1px solid #cbd5e1', fontSize: '0.875rem'
                        }}
                      />
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => {
                            setConfirmConfig({
                              titulo: "Descartar Reporte",
                              mensaje: "¿Rechazar el reporte de falsedad? La denuncia volverá a ser visible y activa.",
                              tipo: "warning",
                              alConfirmar: () => rechazarStrike(st.id, st.id_denuncia, resolucionTexto[st.id])
                            });
                          }}
                          style={{
                            background: '#f1f5f9', color: '#475569', border: 'none',
                            padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem',
                            fontWeight: '700', cursor: 'pointer'
                          }}
                        >
                          ❌ Descartar
                        </button>
                        <button
                          onClick={() => {
                            setConfirmConfig({
                              titulo: "Confirmar Strike",
                              mensaje: `¿Confirmar Strike para ${st.ciudadano?.nombre_completo}? Esto incrementará sus strikes y podría suspender su cuenta.`,
                              tipo: "danger",
                              alConfirmar: () => confirmarStrike(st.id, st.id_ciudadano, resolucionTexto[st.id])
                            });
                          }}
                          style={{
                            background: '#ef4444', color: '#fff', border: 'none',
                            padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem',
                            fontWeight: '700', cursor: 'pointer', boxShadow: '0 2px 4px rgba(239,68,68,0.2)'
                          }}
                        >
                          ✅ Confirmar Strike
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: '20px', border: '1px dashed #cbd5e1' }}>
                  <p style={{ color: '#64748b', fontWeight: '600' }}>No hay reportes de denuncias falsas pendientes.</p>
                </div>
              )}
            </div>
          </div>

          {/* Listado de Ciudadanos */}
          <div style={{ flex: '1' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#1e293b', marginBottom: '1rem' }}>
              👥 Ciudadanos Registrados
            </h3>

            {/* Filtros y Búsqueda */}
            <div style={{ background: '#fff', borderRadius: '16px', padding: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                placeholder="Buscar por nombre o cédula..."
                value={busquedaCiudadano}
                onChange={e => setBusquedaCiudadano(e.target.value)}
                style={{
                  width: '100%', padding: '10px', borderRadius: '10px',
                  border: '1px solid #cbd5e1', fontSize: '0.9rem'
                }}
              />
              <div style={{ display: 'flex', gap: '4px' }}>
                {["todos", "activos", "suspendidos", "baneados"].map(filtro => (
                  <button
                    key={filtro}
                    onClick={() => setFiltroCiudadano(filtro)}
                    style={{
                      flex: 1, padding: '6px', borderRadius: '8px', fontSize: '0.75rem',
                      fontWeight: '700', textTransform: 'capitalize', cursor: 'pointer',
                      border: '1px solid',
                      borderColor: filtroCiudadano === filtro ? 'var(--primary)' : '#cbd5e1',
                      background: filtroCiudadano === filtro ? 'var(--primary-light)' : '#fff',
                      color: filtroCiudadano === filtro ? 'var(--primary)' : '#64748b'
                    }}
                  >
                    {filtro}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {ciudadanos
                .filter(ciu => {
                  const matchBusqueda = ciu.nombre_completo.toLowerCase().includes(busquedaCiudadano.toLowerCase()) || ciu.cedula.includes(busquedaCiudadano);
                  const matchFiltro = 
                    filtroCiudadano === "todos" ||
                    (filtroCiudadano === "activos" && ciu.estado_cuenta === "activo") ||
                    (filtroCiudadano === "suspendidos" && ciu.estado_cuenta === "suspendido") ||
                    (filtroCiudadano === "baneados" && ciu.estado_cuenta === "baneado");
                  return matchBusqueda && matchFiltro;
                })
                .map(ciu => {
                  const multasPendientes = ciu.multas?.filter(m => m.estado === 'pendiente') || [];
                  return (
                    <div
                      key={ciu.id}
                      onClick={() => setUsuarioSeleccionado(ciu)}
                      style={{
                        background: '#fff', borderRadius: '16px', padding: '1rem',
                        border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'transform 0.2s',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                    >
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#0f172a', fontWeight: '800' }}>
                          {ciu.nombre_completo}
                        </h4>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Cédula: {ciu.cedula}
                        </span>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                          <span style={{
                            padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700',
                            background: ciu.estado_cuenta === 'activo' ? '#dcfce7' : ciu.estado_cuenta === 'suspendido' ? '#fef9c3' : '#fee2e2',
                            color: ciu.estado_cuenta === 'activo' ? '#15803d' : ciu.estado_cuenta === 'suspendido' ? '#a16207' : '#b91c1c'
                          }}>
                            {ciu.estado_cuenta.toUpperCase()}
                          </span>
                          <span style={{ fontSize: '0.7rem', fontWeight: '700', color: ciu.strikes_totales > 0 ? '#ef4444' : '#64748b' }}>
                            ⚠️ {ciu.strikes_totales} Strikes
                          </span>
                          {multasPendientes.length > 0 && (
                            <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#b91c1c' }}>
                              💸 C$ {multasPendientes.reduce((acc, m) => acc + Number(m.monto), 0)} pendiente
                            </span>
                          )}
                        </div>
                      </div>
                      <span style={{ color: '#cbd5e1', fontSize: '1.25rem' }}>➔</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE CIUDADANO */}
      {usuarioSeleccionado && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          padding: '1rem', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#fff', padding: '2rem', borderRadius: '24px',
            maxWidth: '560px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', gap: '1.5rem'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.4rem', fontWeight: '800' }}>
                  Detalle del Ciudadano
                </h3>
                <button
                  onClick={() => setUsuarioSeleccionado(null)}
                  style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#64748b', cursor: 'pointer' }}
                >
                  &times;
                </button>
              </div>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                Gestiona strikes, multas y estado de cuenta de <strong>{usuarioSeleccionado.nombre_completo}</strong>
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Cédula</span>
                <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#334155' }}>{usuarioSeleccionado.cedula}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Estado de Cuenta</span>
                <span style={{
                  padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '800', display: 'inline-block', marginTop: '2px',
                  background: usuarioSeleccionado.estado_cuenta === 'activo' ? '#dcfce7' : usuarioSeleccionado.estado_cuenta === 'suspendido' ? '#fef9c3' : '#fee2e2',
                  color: usuarioSeleccionado.estado_cuenta === 'activo' ? '#15803d' : usuarioSeleccionado.estado_cuenta === 'suspendido' ? '#a16207' : '#b91c1c'
                }}>
                  {usuarioSeleccionado.estado_cuenta.toUpperCase()}
                </span>
              </div>
              <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Strikes Acumulados</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[1, 2, 3].map(strikeNum => {
                    const tieneStrike = usuarioSeleccionado.strikes_totales >= strikeNum;
                    return (
                      <div
                        key={strikeNum}
                        style={{
                          flex: 1, height: '10px', borderRadius: '5px',
                          background: tieneStrike ? '#ef4444' : '#e2e8f0'
                        }}
                      />
                    );
                  })}
                </div>
                <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginTop: '4px' }}>
                  Total: {usuarioSeleccionado.strikes_totales} strikes
                </span>
              </div>
            </div>

            {/* Listado de Multas */}
            <div>
              <h4 style={{ margin: '0 0 0.5rem', color: '#1e293b', fontSize: '1rem', fontWeight: '800' }}>
                💸 Multas del Usuario ({usuarioSeleccionado.multas?.length || 0})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {usuarioSeleccionado.multas && usuarioSeleccionado.multas.length > 0 ? (
                  usuarioSeleccionado.multas.map(multa => (
                    <div key={multa.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid #e2e8f0', padding: '10px 14px', borderRadius: '12px' }}>
                      <div>
                        <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#334155' }}>
                          Multa Nivel {multa.nivel} (C$ {multa.monto})
                        </span>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8' }}>
                          Generada: {new Date(multa.creado_el).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700',
                          background: multa.estado === 'pagada' ? '#dcfce7' : multa.estado === 'condonada' ? '#f1f5f9' : '#fee2e2',
                          color: multa.estado === 'pagada' ? '#15803d' : multa.estado === 'condonada' ? '#475569' : '#b91c1c'
                        }}>
                          {multa.estado.toUpperCase()}
                        </span>
                        {multa.estado === 'pendiente' && (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={() => {
                                setConfirmConfig({
                                  titulo: "Condonar Multa",
                                  mensaje: "¿Seguro que deseas condonar esta multa al ciudadano? Esta acción es irreversible.",
                                  tipo: "warning",
                                  alConfirmar: async () => {
                                    await condonarMulta(multa.id, usuarioSeleccionado.id);
                                    setUsuarioSeleccionado(null);
                                  }
                                });
                              }}
                              style={{ background: '#f1f5f9', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
                            >
                              Condonar
                            </button>
                            <button
                              onClick={() => {
                                setConfirmConfig({
                                  titulo: "Registrar Pago",
                                  mensaje: "¿Registrar el pago físico de esta multa? La cuenta del ciudadano se reactivará si no quedan multas pendientes.",
                                  tipo: "success",
                                  alConfirmar: async () => {
                                    await registrarPagoMulta(multa.id, usuarioSeleccionado.id);
                                    setUsuarioSeleccionado(null);
                                  }
                                });
                              }}
                              style={{ background: '#10b981', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                            >
                              Pagar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>
                    Este usuario no tiene multas registradas.
                  </p>
                )}
              </div>
            </div>

            {/* Información Biométrica y de Identidad */}
            {(usuarioSeleccionado.foto_selfie_url || usuarioSeleccionado.foto_cedula_frente_url || usuarioSeleccionado.foto_cedula_atras_url) && (
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h4 style={{ margin: '0 0 4px', color: '#1e293b', fontSize: '0.9rem', fontWeight: '800', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🪪 Identidad y Biometría</span>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: '800',
                    color: usuarioSeleccionado.verificado_ia ? '#10b981' : '#ef4444',
                    background: usuarioSeleccionado.verificado_ia ? '#e6f4ea' : '#fce8e6',
                    padding: '2px 8px', borderRadius: '12px'
                  }}>
                    {usuarioSeleccionado.verificado_ia ? "✓ Verificado por IA" : "✗ Rechazado / No verificado"}
                  </span>
                </h4>

                {usuarioSeleccionado.motivo_rechazo_ia && (
                  <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                    Motivo IA: "{usuarioSeleccionado.motivo_rechazo_ia}"
                  </p>
                )}

                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {usuarioSeleccionado.foto_selfie_url && (
                    <div style={{ flexShrink: 0, width: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748b' }}>Selfie (Perfil)</span>
                      <a href={usuarioSeleccionado.foto_selfie_url} target="_blank" rel="noreferrer" style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #e2e8f0', display: 'block' }}>
                        <img src={usuarioSeleccionado.foto_selfie_url} alt="Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </a>
                    </div>
                  )}
                  {usuarioSeleccionado.foto_cedula_frente_url && (
                    <div style={{ flexShrink: 0, width: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748b' }}>Cédula Frente</span>
                      <a href={usuarioSeleccionado.foto_cedula_frente_url} target="_blank" rel="noreferrer" style={{ width: '110px', height: '70px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #e2e8f0', display: 'block' }}>
                        <img src={usuarioSeleccionado.foto_cedula_frente_url} alt="Cédula Frente" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </a>
                    </div>
                  )}
                  {usuarioSeleccionado.foto_cedula_atras_url && (
                    <div style={{ flexShrink: 0, width: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748b' }}>Cédula Atrás</span>
                      <a href={usuarioSeleccionado.foto_cedula_atras_url} target="_blank" rel="noreferrer" style={{ width: '110px', height: '70px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #e2e8f0', display: 'block' }}>
                        <img src={usuarioSeleccionado.foto_cedula_atras_url} alt="Cédula Atrás" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Acciones del Administrador */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h4 style={{ margin: '0 0 4px', color: '#1e293b', fontSize: '0.9rem', fontWeight: '800', textTransform: 'uppercase' }}>
                Acciones de Moderación
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {usuarioSeleccionado.strikes_totales > 0 && (
                  <button
                    onClick={() => {
                      setConfirmConfig({
                        titulo: "Quitar Strike",
                        mensaje: `¿Deseas restar 1 strike a ${usuarioSeleccionado.nombre_completo}?`,
                        tipo: "warning",
                        alConfirmar: async () => {
                          await quitarStrike(usuarioSeleccionado.id);
                          setUsuarioSeleccionado(null);
                        }
                      });
                    }}
                    style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    ➖ Quitar Strike
                  </button>
                )}
                {usuarioSeleccionado.estado_cuenta === 'activo' && (
                  <button
                    onClick={() => {
                      setConfirmConfig({
                        titulo: "Suspender Cuenta",
                        mensaje: `¿Suspender temporalmente la cuenta de ${usuarioSeleccionado.nombre_completo}? El usuario no podrá iniciar sesión en la plataforma.`,
                        tipo: "warning",
                        alConfirmar: async () => {
                          await cambiarEstadoCuenta(usuarioSeleccionado.id, 'suspendido');
                          setUsuarioSeleccionado(null);
                        }
                      });
                    }}
                    style={{ flex: 1, background: '#fef9c3', color: '#a16207', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    🚫 Suspender Cuenta
                  </button>
                )}
                {usuarioSeleccionado.estado_cuenta !== 'baneado' && (
                  <button
                    onClick={() => {
                      setConfirmConfig({
                        titulo: "Banear Permanente",
                        mensaje: `¿Banear permanentemente a ${usuarioSeleccionado.nombre_completo}? Solo podrá reactivarse manualmente por un Super Administrador.`,
                        tipo: "danger",
                        alConfirmar: async () => {
                          await cambiarEstadoCuenta(usuarioSeleccionado.id, 'baneado');
                          setUsuarioSeleccionado(null);
                        }
                      });
                    }}
                    style={{ flex: 1, background: '#fee2e2', color: '#b91c1c', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    💀 Banear Permanente
                  </button>
                )}
                {usuarioSeleccionado.estado_cuenta !== 'activo' && (
                  <button
                    onClick={() => {
                      setConfirmConfig({
                        titulo: "Reactivar Cuenta",
                        mensaje: `¿Reactivar la cuenta de ${usuarioSeleccionado.nombre_completo} ahora mismo?`,
                        tipo: "success",
                        alConfirmar: async () => {
                          await cambiarEstadoCuenta(usuarioSeleccionado.id, 'activo');
                          setUsuarioSeleccionado(null);
                        }
                      });
                    }}
                    style={{ flex: 1, background: '#dcfce7', color: '#15803d', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    🎉 Reactivar Cuenta
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Éxito Código */}
      {codigoGenerado && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '24px', textAlign: 'center', maxWidth: '420px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem', lineHeight: 1 }}>✅</div>
            <h2 style={{ margin: '0 0 1rem', color: '#0f172a', fontSize: '1.75rem', fontWeight: '800' }}>¡Entidad Creada!</h2>
            <p style={{ margin: '0 0 1.5rem', color: '#64748b', fontSize: '1rem', lineHeight: 1.5 }}>
              Comparte este código de invitación con el administrador de la entidad para que pueda registrar su cuenta.
            </p>
            <div style={{ background: '#f1f5f9', padding: '1.25rem', borderRadius: '16px', marginBottom: '2rem', border: '2px dashed #cbd5e1' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: '800', color: '#2563eb', letterSpacing: '4px' }}>
                {codigoGenerado}
              </span>
            </div>
            <button 
              onClick={() => setCodigoGenerado(null)} 
              style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '14px 24px', borderRadius: '12px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', width: '100%', transition: 'all 0.2s' }}
            >
              Cerrar y Continuar
            </button>
          </div>
        </div>
      )}

      {/* Modal de Confirmación Personalizado */}
      {confirmConfig && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '24px', maxWidth: '440px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0,
                background: confirmConfig.tipo === 'danger' ? '#fef2f2' : confirmConfig.tipo === 'warning' ? '#fff7ed' : '#f0fdf4',
                color: confirmConfig.tipo === 'danger' ? '#ef4444' : confirmConfig.tipo === 'warning' ? '#f97316' : '#16a34a'
              }}>
                {confirmConfig.tipo === 'danger' ? '🚨' : confirmConfig.tipo === 'warning' ? '⚠️' : '❓'}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '1.2rem', fontWeight: '800' }}>
                  {confirmConfig.titulo}
                </h3>
                <p style={{ margin: 0, color: '#475569', fontSize: '0.925rem', lineHeight: 1.5 }}>
                  {confirmConfig.mensaje}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                onClick={() => setConfirmConfig(null)}
                style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s' }}
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const action = confirmConfig.alConfirmar;
                  setConfirmConfig(null);
                  await action();
                }}
                style={{
                  background: confirmConfig.tipo === 'danger' ? '#ef4444' : confirmConfig.tipo === 'warning' ? '#f97316' : '#2563eb',
                  color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: confirmConfig.tipo === 'danger' ? '0 4px 6px rgba(239,68,68,0.2)' : confirmConfig.tipo === 'warning' ? '0 4px 6px rgba(249,115,22,0.2)' : '0 4px 6px rgba(37,99,235,0.2)'
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edición de Entidad */}
      {entidadEdicion && (
        <div
          onClick={() => setEntidadEdicion(null)}
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
                ✏️ Editar Nombre de Entidad
              </h3>
              <button
                onClick={() => setEntidadEdicion(null)}
                style={{
                  background: '#f1f5f9', border: 'none', color: '#475569',
                  borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer',
                  fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold'
                }}
              >✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#64748b' }}>
                Nuevo Nombre:
              </label>
              <input
                type="text"
                value={entidadEdicion.nombre}
                onChange={(e) => setEntidadEdicion({ ...entidadEdicion, nombre: e.target.value })}
                style={{
                  width: '100%', 
                  padding: '12px', 
                  borderRadius: '10px', 
                  border: '1px solid #cbd5e1', 
                  fontSize: '0.95rem',
                  outline: 'none',
                  fontWeight: '600',
                  color: '#1e293b'
                }}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                onClick={() => setEntidadEdicion(null)}
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
                onClick={async () => {
                  if (entidadEdicion.nombre.trim()) {
                    await actualizarEntidad(entidadEdicion.id, { nombre: entidadEdicion.nombre.trim() });
                    setEntidadEdicion(null);
                  }
                }}
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
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
