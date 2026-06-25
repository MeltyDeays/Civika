import { useState, useMemo } from "react";
import { useCuadrillas } from "../Controladores/useCuadrillas";

// eslint-disable-next-line react-refresh/only-export-components
export const EMOJIS_ESPECIALIDAD = {
  ingeniero: "🧠",
  operador_maquinaria: "🛡️",
  albanil: "🧱",
  electricista: "⚡",
  fontanero: "💧",
  general: "🛠️"
};

const NOMBRES_ESPECIALIDAD = {
  ingeniero: "Ingeniero / Supervisor",
  operador_maquinaria: "Operador Maquinaria",
  albanil: "Albañil / Obra Civil",
  electricista: "Electricista",
  fontanero: "Fontanero",
  general: "Técnico General"
};

export default function CuadrillasView() {
  const { 
    tecnicos, cuadrillas, invitaciones, error, 
    crearCuadrilla, alternarEstado, eliminarCuadrilla, 
    generarInvitacion, eliminarInvitacion, editarInvitacion,
    editarTecnico, desactivarTecnico, reactivarTecnico
  } = useCuadrillas();
  
  const [tabActual, setTabActual] = useState("cuadrillas");
  const [mostrandoForm, setMostrandoForm] = useState(false);
  const [procesandoTec, setProcesandoTec] = useState("");
  const [nombre, setNombre] = useState("");
  const [tamanoMaximo, setTamanoMaximo] = useState(4);
  const [liderId, setLiderId] = useState("");
  const [seleccionados, setSeleccionados] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [espReclutamiento, setEspReclutamiento] = useState("general");
  const [generandoInv, setGenerandoInv] = useState(false);
  const [tecnicoEdicion, setTecnicoEdicion] = useState(null);

  const balance = useMemo(() => {
    const todosId = liderId ? [liderId, ...seleccionados] : seleccionados;
    const conteo = {};
    for (const tId of todosId) {
      const tec = tecnicos.find(t => t.id === tId);
      if (tec) conteo[tec.especialidad] = (conteo[tec.especialidad] || 0) + 1;
    }
    return conteo;
  }, [liderId, seleccionados, tecnicos]);

  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (!nombre || !liderId) return;
    setEnviando(true);
    try {
      await crearCuadrilla({
        nombre,
        tamano_maximo: Number(tamanoMaximo),
        id_lider: liderId,
        miembrosIds: seleccionados
      });
      setMostrandoForm(false);
      setNombre(""); setLiderId(""); setSeleccionados([]); setTamanoMaximo(4);
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setEnviando(false);
    }
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <section style={{ padding: isMobile ? '1rem' : '2rem', background: '#f7f3f5', minHeight: '100vh' }}>
      <header className="network-nodes-bg" style={{ 
        background: 'linear-gradient(135deg, var(--dark-sidebar-start) 0%, var(--primary) 100%)', 
        borderRadius: isMobile ? '16px' : '24px', 
        padding: isMobile ? '1.5rem' : '2.5rem', 
        color: '#fff',
        marginBottom: '2rem',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '1.25rem',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'center',
        boxShadow: '0 20px 25px -5px var(--primary-glow)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: isMobile ? '1.8rem' : '2.2rem', fontWeight: '800' }}>Gestión de Personal</h1>
          <p style={{ margin: '8px 0 0', opacity: 0.8, fontSize: isMobile ? '0.95rem' : '1.1rem' }}>Organiza tus escuadrones tácticos y recluta nuevos técnicos especializados.</p>
        </div>
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.1)', padding: '6px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button 
            onClick={() => setTabActual('cuadrillas')}
            style={{ 
              flex: isMobile ? 1 : 'none',
              padding: '10px 24px', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer',
              background: tabActual === 'cuadrillas' ? '#fff' : 'transparent',
              color: tabActual === 'cuadrillas' ? 'var(--primary)' : '#fff',
              transition: 'all 0.2s'
            }}
          >🛡️ Cuadrillas</button>
          <button 
            onClick={() => setTabActual('personal')}
            style={{ 
              flex: isMobile ? 1 : 'none',
              padding: '10px 24px', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer',
              background: tabActual === 'personal' ? '#fff' : 'transparent',
              color: tabActual === 'personal' ? 'var(--primary)' : '#fff',
              transition: 'all 0.2s'
            }}
          >👤 Personal</button>
          <button 
            onClick={() => setTabActual('reclutamiento')}
            style={{ 
              flex: isMobile ? 1 : 'none',
              padding: '10px 24px', borderRadius: '12px', border: 'none', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer',
              background: tabActual === 'reclutamiento' ? '#fff' : 'transparent',
              color: tabActual === 'reclutamiento' ? 'var(--primary)' : '#fff',
              transition: 'all 0.2s'
            }}
          >📩 Reclutar</button>
        </div>
      </header>

      {error && (
        <div style={{ background: '#fef2f2', color: '#ef4444', padding: '1rem 1.5rem', borderRadius: '16px', border: '1px solid #fee2e2', marginBottom: '2rem', fontWeight: '600' }}>
          ⚠️ {error}
        </div>
      )}

      {tabActual === 'cuadrillas' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Header de Sección Cuadrillas */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ margin: 0, color: '#1e293b', fontWeight: '800' }}>Escuadrones Activos</h2>
            <button 
              onClick={() => setMostrandoForm(!mostrandoForm)}
              style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 6px var(--primary-glow)' }}
            >
              {mostrandoForm ? "✕ Cerrar Formulario" : "+ Nueva Cuadrilla"}
            </button>
          </div>

          {mostrandoForm && (
            <form onSubmit={manejarEnvio} style={{ background: '#fff', padding: '2rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Nombre de la Cuadrilla</label>
                  <input style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc' }} value={nombre} onChange={e => setNombre(e.target.value)} required placeholder="Ej: Equipo de Respuesta Rápida" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Capacidad</label>
                  <select style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: '600' }} value={tamanoMaximo} onChange={e => setTamanoMaximo(Number(e.target.value))}>
                    <option value={4}>Básica (4)</option>
                    <option value={8}>Reforzada (8)</option>
                    <option value={12}>Máxima (12)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Capitán de Cuadrilla</label>
                <select style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: '600' }} value={liderId} onChange={e => { setLiderId(e.target.value); setSeleccionados(prev => prev.filter(id => id !== e.target.value)); }} required>
                  <option value="">Seleccionar líder...</option>
                  {tecnicos.filter(t => t.activo !== false).map(t => (
                    <option key={t.id} value={t.id}>{EMOJIS_ESPECIALIDAD[t.especialidad]} {t.nombre_completo}</option>
                  ))}
                </select>
              </div>

              {liderId && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>
                    Miembros ({seleccionados.length}/{tamanoMaximo - 1} máx.)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))', gap: '8px', background: '#f8fafc', padding: '1rem', borderRadius: '14px', border: '1px solid #e2e8f0', maxHeight: '240px', overflowY: 'auto' }}>
                    {tecnicos.filter(t => t.id !== liderId && t.activo !== false).map(t => {
                      const checked = seleccionados.includes(t.id);
                      const disabled = !checked && seleccionados.length >= tamanoMaximo - 1;
                      return (
                        <label key={t.id} style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          padding: '10px 12px', borderRadius: '12px', cursor: disabled ? 'not-allowed' : 'pointer',
                          background: checked ? '#eff6ff' : '#fff', border: `1px solid ${checked ? '#3b82f6' : '#e2e8f0'}`,
                          opacity: disabled ? 0.5 : 1, transition: 'all 0.15s'
                        }}>
                          <input type="checkbox" checked={checked} disabled={disabled} onChange={() => {
                            setSeleccionados(prev => checked ? prev.filter(id => id !== t.id) : [...prev, t.id]);
                          }} style={{ width: '18px', height: '18px', accentColor: '#3b82f6' }} />
                          <span style={{ fontSize: '1.1rem' }}>{EMOJIS_ESPECIALIDAD[t.especialidad]}</span>
                          <span style={{ fontWeight: '600', color: '#334155', fontSize: '0.85rem' }}>{t.nombre_completo}</span>
                        </label>
                      );
                    })}
                    {tecnicos.filter(t => t.id !== liderId && t.activo !== false).length === 0 && (
                      <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600', gridColumn: '1 / -1', textAlign: 'center', padding: '1rem' }}>No hay más técnicos disponibles. Genera invitaciones para reclutar.</p>
                    )}
                  </div>
                  {Object.keys(balance).length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                      {Object.entries(balance).map(([esp, count]) => (
                        <span key={esp} style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>
                          {EMOJIS_ESPECIALIDAD[esp]} {NOMBRES_ESPECIALIDAD[esp]}: {count}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button type="submit" disabled={enviando} style={{ width: '100%', background: 'var(--primary)', color: '#fff', border: 'none', padding: '16px', borderRadius: '14px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px var(--primary-glow)' }}>
                {enviando ? "Consolidando..." : `Consolidar Escuadrón Táctico (${1 + seleccionados.length} miembros)`}
              </button>
            </form>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '2rem' }}>
            {cuadrillas.map(c => (
              <article key={c.id} style={{ background: '#fff', borderRadius: '24px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>{c.nombre}</h3>
                  <span style={{ padding: '4px 12px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '800', background: c.activa ? '#ecfdf5' : '#f1f5f9', color: c.activa ? '#10b981' : '#64748b' }}>
                    {c.activa ? "EN SERVICIO" : "EN RESERVA"}
                  </span>
                </div>

                <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Capitán</div>
                  <div style={{ fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>{EMOJIS_ESPECIALIDAD[c.perfiles?.especialidad] || '🛠️'}</span>
                    {c.perfiles?.nombre_completo}
                  </div>
                </div>

                {c.cuadrilla_miembros && c.cuadrilla_miembros.length > 0 && (
                  <div style={{ background: '#f8fafc', borderRadius: '16px', padding: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Miembros ({c.cuadrilla_miembros.length})</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {c.cuadrilla_miembros.map((m, i) => (
                        <div key={i} style={{ fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                          <span>{EMOJIS_ESPECIALIDAD[m.perfiles?.especialidad] || '🛠️'}</span>
                          {m.perfiles?.nombre_completo || 'Técnico'}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(!c.cuadrilla_miembros || c.cuadrilla_miembros.length === 0) && (
                  <div style={{ background: '#fffbeb', borderRadius: '12px', padding: '10px', marginBottom: '1.5rem', fontSize: '0.8rem', color: '#d97706', fontWeight: '600', textAlign: 'center' }}>
                    Sin miembros asignados
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => alternarEstado(c.id, !c.activa)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)', background: '#fff', color: 'var(--primary)', fontWeight: '700', cursor: 'pointer' }}>
                    {c.activa ? "Poner en Reserva" : "Activar"}
                  </button>
                  <button onClick={() => { if(window.confirm("¿Disolver cuadrilla?")) eliminarCuadrilla(c.id) }} style={{ padding: '10px', borderRadius: '10px', border: 'none', background: '#fee2e2', color: '#ef4444', fontWeight: '700', cursor: 'pointer' }}>
                    🗑️
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <form style={{ background: '#fff', padding: '2.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }} 
            onSubmit={async (e) => {
              e.preventDefault();
              setGenerandoInv(true);
              try { await generarInvitacion(espReclutamiento); } catch (err) { alert(err.message); } finally { setGenerandoInv(false); }
            }}>
            <h2 style={{ margin: '0 0 1rem', color: '#1e293b' }}>Generar Reclutamiento</h2>
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>Genera códigos de invitación para que nuevos técnicos se unan a tu entidad.</p>
            
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Especialidad Requerida</label>
              <select style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '1rem', fontWeight: '600' }} value={espReclutamiento} onChange={e => setEspReclutamiento(e.target.value)}>
                {Object.entries(NOMBRES_ESPECIALIDAD).map(([k, v]) => (
                  <option key={k} value={k}>{EMOJIS_ESPECIALIDAD[k]} {v}</option>
                ))}
              </select>
            </div>

            <button type="submit" disabled={generandoInv} style={{ width: '100%', background: 'var(--primary)', color: '#fff', border: 'none', padding: '16px', borderRadius: '14px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 6px var(--primary-glow)' }}>
              {generandoInv ? "Generando Código..." : "+ Generar Código de Invitación"}
            </button>
          </form>

          <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(250px, 100%), 1fr))', gap: '1.5rem' }}>
            {invitaciones.map(inv => (
              <article key={inv.id} style={{ background: '#fff', padding: '1.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: '900', fontFamily: 'monospace', letterSpacing: '4px', color: '#1e293b', textAlign: 'center', background: '#f1f5f9', padding: '1rem', borderRadius: '12px' }}>
                  {inv.codigo}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {!inv.usado ? (
                    <select 
                      value={inv.especialidad}
                      onChange={(e) => editarInvitacion(inv.id, e.target.value).catch(err => alert("Error al editar: " + err.message))}
                      style={{ padding: '6px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', background: '#f8fafc' }}
                      title="Editar especialidad del código"
                    >
                      {Object.entries(NOMBRES_ESPECIALIDAD).map(([k, v]) => (
                        <option key={k} value={k}>{EMOJIS_ESPECIALIDAD[k]} {v}</option>
                      ))}
                    </select>
                  ) : (
                    <span 
                      style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '700', cursor: 'not-allowed' }} 
                      title="No se puede editar un código ya utilizado"
                      onClick={() => alert("No se puede editar un código de invitación que ya ha sido utilizado por un técnico.")}
                    >
                      {EMOJIS_ESPECIALIDAD[inv.especialidad]} {NOMBRES_ESPECIALIDAD[inv.especialidad] || inv.especialidad} 🔒
                    </span>
                  )}
                  <span style={{ fontSize: '0.7rem', fontWeight: '800', color: inv.usado ? '#94a3b8' : '#3b82f6' }}>{inv.usado ? "USADO" : "DISPONIBLE"}</span>
                </div>
                {!inv.usado && (
                  <button onClick={() => eliminarInvitacion(inv.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', textAlign: 'right' }}>Cancelar invitación</button>
                )}
              </article>
            ))}
          </div>
        </div>
      )}

      {/* TAB PERSONAL — H023: Gestión individual de técnicos */}
      {tabActual === 'personal' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ margin: 0, color: '#1e293b', fontWeight: '800' }}>Técnicos Registrados ({tecnicos.length})</h2>
          </div>

          {tecnicos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: '24px', border: '1px dashed #cbd5e1' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👤</div>
              <h3 style={{ margin: 0, color: '#1e293b' }}>Sin técnicos registrados</h3>
              <p style={{ color: '#64748b' }}>Genera códigos de invitación en la pestaña "Reclutar" para incorporar personal.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '1.5rem' }}>
              {tecnicos.map(tec => {
                const activo = tec.activo !== false;
                const procesando = procesandoTec === tec.id;
                return (
                  <article key={tec.id} style={{
                    background: '#fff', borderRadius: '24px', padding: '1.5rem',
                    border: `1px solid ${activo ? '#e2e8f0' : '#fee2e2'}`,
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
                    opacity: activo ? 1 : 0.7,
                    position: 'relative'
                  }}>
                    {/* Badge de estado */}
                    <span style={{
                      position: 'absolute', top: '1rem', right: '1rem',
                      padding: '4px 12px', borderRadius: '10px', fontSize: '0.7rem',
                      fontWeight: '800', textTransform: 'uppercase',
                      background: activo ? '#ecfdf5' : '#fef2f2',
                      color: activo ? '#10b981' : '#ef4444'
                    }}>
                      {activo ? '🟢 Activo' : '🔴 Inactivo'}
                    </span>

                    {/* Datos del técnico */}
                    <div style={{ marginBottom: '1.5rem', paddingRight: '90px' }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>
                        {EMOJIS_ESPECIALIDAD[tec.especialidad] || '🛠️'}
                      </div>
                      <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', color: '#1e293b', fontWeight: '800' }}>
                        {tec.nombre_completo}
                      </h3>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>
                        {NOMBRES_ESPECIALIDAD[tec.especialidad] || tec.especialidad}
                      </p>
                    </div>

                    {/* Acciones H023 */}
                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                      <button
                        disabled={procesando}
                        onClick={() => {
                          setTecnicoEdicion({ id: tec.id, nombre_completo: tec.nombre_completo });
                        }}
                        style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}
                      >✏️ Editar</button>

                      {activo ? (
                        <button
                          disabled={procesando}
                          onClick={async () => {
                            if (!window.confirm(`¿Desactivar a ${tec.nombre_completo}? Se validará que no tenga tareas activas.`)) return;
                            setProcesandoTec(tec.id);
                            try { await desactivarTecnico(tec.id); }
                            catch (e) { alert(e.message); }
                            finally { setProcesandoTec(''); }
                          }}
                          style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#fef2f2', color: '#ef4444', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}
                        >🚫 Desactivar</button>
                      ) : (
                        <button
                          disabled={procesando}
                          onClick={async () => {
                            setProcesandoTec(tec.id);
                            try { await reactivarTecnico(tec.id); }
                            catch (e) { alert(e.message); }
                            finally { setProcesandoTec(''); }
                          }}
                          style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: '#ecfdf5', color: '#10b981', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}
                        >✅ Reactivar</button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Edición de Técnico */}
      {tecnicoEdicion && (
        <div
          onClick={() => setTecnicoEdicion(null)}
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
                ✏️ Editar Nombre de Técnico
              </h3>
              <button
                onClick={() => setTecnicoEdicion(null)}
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
                Nombre Completo:
              </label>
              <input
                type="text"
                value={tecnicoEdicion.nombre_completo}
                onChange={(e) => setTecnicoEdicion({ ...tecnicoEdicion, nombre_completo: e.target.value })}
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
                onClick={() => setTecnicoEdicion(null)}
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
                  if (tecnicoEdicion.nombre_completo.trim()) {
                    setProcesandoTec(tecnicoEdicion.id);
                    try {
                      await editarTecnico(tecnicoEdicion.id, { nombre_completo: tecnicoEdicion.nombre_completo.trim() });
                    } catch (e) {
                      alert(e.message);
                    } finally {
                      setProcesandoTec('');
                      setTecnicoEdicion(null);
                    }
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
