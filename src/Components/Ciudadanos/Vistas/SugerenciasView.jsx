import ModalSugerencia from "../../../modals/SuggestionModal";
import { formatearFecha } from "../../../utils/formatters";
import { useSugerenciasCiudadano } from "../Controladores/useSugerenciasCiudadano";
import { useState, useMemo } from "react";
import { DEPARTAMENTOS_NICARAGUA } from "../../../utils/constants";

export default function CiudadanoSugerenciasView() {
  const { items, crear } = useSugerenciasCiudadano();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroDep, setFiltroDep] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  // Lógica para detectar la propuesta más popular dinámicamente
  const propuestaDestacada = useMemo(() => {
    if (!items || items.length === 0) return null;
    // Ordenar por firmas descendente y tomar la primera
    return [...items].sort((a, b) => (b.firmas || 0) - (a.firmas || 0))[0];
  }, [items]);

  const itemsFiltrados = useMemo(() => {
    return items.filter(item => {
      const matchText = item.titulo.toLowerCase().includes(busqueda.toLowerCase()) || 
                        item.descripcion.toLowerCase().includes(busqueda.toLowerCase());
      const matchDep = filtroDep === "todos" || item.departamento === filtroDep;
      const matchTipo = filtroTipo === "todos" || (item.tipo || 'sugerencia') === filtroTipo;
      return matchText && matchDep && matchTipo;
    });
  }, [items, busqueda, filtroDep, filtroTipo]);

  const stats = useMemo(() => {
    return {
      sugerencias: items.filter(i => !i.tipo || i.tipo === 'sugerencia').length,
      reformas: items.filter(i => i.tipo === 'reforma').length,
      firmasTotales: items.reduce((acc, curr) => acc + (curr.firmas || 0), 0)
    };
  }, [items]);

  const crearNuevaSugerencia = async (payload) => {
    await crear(payload);
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <section style={{ paddingBottom: '3rem' }}>
      {/* Header con Banner Premium */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'stretch' : 'center', 
          marginBottom: '1.5rem',
          gap: '1rem' 
        }}>
          <div>
            <h1 style={{ fontSize: isMobile ? '1.6rem' : '2rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>Sugerencias y Reformas</h1>
            <p style={{ color: '#64748b', marginTop: '4px', fontSize: isMobile ? '0.9rem' : '1rem' }}>Firma las propuestas ciudadanas que más te importen. Tu firma cuenta.</p>
          </div>
          <button onClick={() => setModalAbierto(true)} className="primary-btn" style={{ height: '48px', padding: '0 24px', fontWeight: '700', width: isMobile ? '100%' : 'auto' }}>
            📝 Nueva Propuesta
          </button>
        </div>

        {/* Banner Dinámico: Solo se muestra si hay al menos una propuesta */}
        {propuestaDestacada && (
          <div style={{ 
            background: 'linear-gradient(135deg, #1f64ff 0%, #1248c7 100%)', 
            borderRadius: '24px', 
            padding: isMobile ? '1.5rem' : '2.5rem', 
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 20px 40px -10px rgba(31, 100, 255, 0.4)',
            transition: 'all 0.5s ease-in-out'
          }}>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', opacity: 0.9 }}>
                <span>📈</span>
                <span style={{ fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Propuesta más apoyada {propuestaDestacada.tipo === 'reforma' ? '(Reforma)' : '(Sugerencia)'}
                </span>
              </div>
              <h2 style={{ fontSize: isMobile ? '1.4rem' : '1.8rem', margin: '0 0 12px', fontWeight: '800' }}>{propuestaDestacada.titulo}</h2>
              <p style={{ maxWidth: '800px', opacity: 0.9, lineHeight: 1.6, marginBottom: '2rem', fontSize: isMobile ? '0.95rem' : '1.05rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                {propuestaDestacada.descripcion}
              </p>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.8 }}>
                  <span>📍</span>
                  <span>{propuestaDestacada.departamento}, {propuestaDestacada.municipio || propuestaDestacada.departamento}</span>
                </div>
                <div style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  padding: '10px 24px', 
                  borderRadius: '16px', 
                  fontWeight: '800',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  justifyContent: 'center'
                }}>
                  🖋️ {propuestaDestacada.firmas?.toLocaleString() || 0} firmas
                </div>
              </div>
            </div>
            {/* Decoración */}
            <div style={{ position: 'absolute', right: '-50px', top: '-50px', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
          </div>
        )}
      </div>

      {/* Mini Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(145px, 100%), 1fr))', 
        gap: isMobile ? '0.85rem' : '1.5rem', 
        marginBottom: '2.5rem' 
      }}>
        <div style={{ background: '#fff', padding: isMobile ? '1rem' : '1.5rem', borderRadius: '20px', border: '1px solid #eef2f6', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>💡</div>
          <div style={{ fontSize: isMobile ? '1.5rem' : '2.2rem', fontWeight: '800', color: '#0f172a' }}>{stats.sugerencias}</div>
          <div style={{ color: '#64748b', fontWeight: '600', fontSize: '0.85rem' }}>Sugerencias</div>
        </div>
        <div style={{ background: '#fff', padding: isMobile ? '1rem' : '1.5rem', borderRadius: '20px', border: '1px solid #eef2f6', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>📄</div>
          <div style={{ fontSize: isMobile ? '1.5rem' : '2.2rem', fontWeight: '800', color: '#0f172a' }}>{stats.reformas}</div>
          <div style={{ color: '#64748b', fontWeight: '600', fontSize: '0.85rem' }}>Reformas</div>
        </div>
        <div style={{ background: '#fff', padding: isMobile ? '1rem' : '1.5rem', borderRadius: '20px', border: '1px solid #eef2f6', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🖋️</div>
          <div style={{ fontSize: isMobile ? '1.5rem' : '2.2rem', fontWeight: '800', color: '#0f172a' }}>{stats.firmasTotales.toLocaleString()}</div>
          <div style={{ color: '#64748b', fontWeight: '600', fontSize: '0.85rem' }}>Firmas Totales</div>
        </div>
      </div>

      {/* Toolbar Filtrado */}
      <div className="toolbar-premium" style={{ 
        marginBottom: '2rem',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: '1rem'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          color: '#64748b', 
          fontWeight: '600', 
          borderRight: isMobile ? 'none' : '1px solid #e2e8f0', 
          borderBottom: isMobile ? '1px solid #e2e8f0' : 'none',
          paddingRight: isMobile ? '0' : '1rem',
          paddingBottom: isMobile ? '0.5rem' : '0'
        }}>
          <span>📋</span> Filtrar:
        </div>
        <select className="minimal-select" style={{ width: isMobile ? '100%' : '220px' }} value={filtroDep} onChange={(e) => setFiltroDep(e.target.value)}>
          <option value="todos">Todos los departamentos</option>
          {Object.keys(DEPARTAMENTOS_NICARAGUA).map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="minimal-select" style={{ width: isMobile ? '100%' : '180px' }} value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
          <option value="todos">Todos los tipos</option>
          <option value="sugerencia">Sugerencias</option>
          <option value="reforma">Reformas</option>
        </select>
        <div style={{ flex: 1, position: 'relative', width: '100%' }}>
          <input 
            style={{ width: '100%', height: '40px', paddingLeft: '32px', borderRadius: '10px', border: '1px solid #e2e8f0' }} 
            placeholder="Buscar por título o contenido..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
        </div>
      </div>

      {/* Grid de Propuestas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))', gap: '1.5rem' }}>
        {itemsFiltrados.map((item) => (
          <article key={item.id} style={{ 
            background: '#fff', 
            borderRadius: '24px', 
            padding: '1.5rem', 
            border: '1px solid #eef2f6',
            boxShadow: '0 10px 20px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ 
                  background: (item.tipo === 'reforma' ? '#f5f3ff' : '#fff7ed'), 
                  color: (item.tipo === 'reforma' ? '#7c3aed' : '#f59e0b'),
                  padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', border: '1px solid currentColor'
                }}>
                  {item.tipo === 'reforma' ? '📝 Reforma' : '💡 Sugerencia'}
                </span>
                <span style={{ background: '#f8fafc', color: '#64748b', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>
                  ● {item.prioridad || 'media'}
                </span>
              </div>
            </div>

            <div>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', color: '#0f172a', fontWeight: '800' }}>{item.titulo}</h3>
              <p style={{ margin: 0, color: '#64748b', lineHeight: 1.5, fontSize: '0.95rem' }}>{item.descripcion}</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.85rem' }}>
              <span>📍</span>
              <span>{item.departamento}, {item.municipio || item.departamento}</span>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: '#0f172a', fontWeight: '700', fontSize: '0.85rem' }}>Propuesto por {item.autor || 'Ciudadano'}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{formatearFecha(item.creado_el)}</div>
              </div>
              <button style={{ 
                background: '#f8faff', 
                color: '#1f64ff', 
                border: '1px solid #e0e7ff', 
                padding: '10px 18px', 
                borderRadius: '12px', 
                fontWeight: '800', 
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}>
                🖊️ {item.firmas || 0} firmas
              </button>
            </div>
          </article>
        ))}
      </div>

      <ModalSugerencia
        estaAbierto={modalAbierto}
        alCerrar={() => setModalAbierto(false)}
        alEnviar={crearNuevaSugerencia}
      />
    </section>
  );
}
