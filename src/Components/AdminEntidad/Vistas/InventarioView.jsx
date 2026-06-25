import { useMemo, useState } from "react";
import { useAuth } from "../../../modules/auth/controllers/useAuth.jsx";
import { useInventarioAdminEntidad } from "../Controladores/useInventarioAdminEntidad";

const CATEGORIAS_MATERIAL = [
  "Eléctrico",
  "Hidráulico",
  "Construcción",
  "Vialidad",
  "Telecomunicaciones",
  "Seguridad",
  "Herramientas",
  "Equipos de Protección",
  "Señalización",
  "General",
];

const CAT_ICONOS = {
  "Eléctrico": "⚡",
  "Hidráulico": "🔧",
  "Construcción": "🧱",
  "Vialidad": "🛣️",
  "Telecomunicaciones": "📡",
  "Seguridad": "🛡️",
  "Herramientas": "🔨",
  "Equipos de Protección": "🦺",
  "Señalización": "🚧",
  "General": "📦",
};

const CAT_COLORES = {
  "Eléctrico": "#f59e0b",
  "Hidráulico": "#3b82f6",
  "Construcción": "#78716c",
  "Vialidad": "#10b981",
  "Telecomunicaciones": "#8b5cf6",
  "Seguridad": "#ef4444",
  "Herramientas": "#6366f1",
  "Equipos de Protección": "#ec4899",
  "Señalización": "#f97316",
  "General": "#94a3b8",
};

export default function InventarioView() {
  const { perfil } = useAuth();
  const entidadId = perfil?.id_entidad;
  const { inventario, materiales, cargando, upsertItem, crearMaterial } = useInventarioAdminEntidad(entidadId);

  const [materialId, setMaterialId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [stockMinimo, setStockMinimo] = useState("10");
  const [creando, setCreando] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevaUnidad, setNuevaUnidad] = useState("unidad");
  const [nuevaCategoria, setNuevaCategoria] = useState("General");
  const [feedback, setFeedback] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todos");

  const lista = useMemo(() => {
    return (inventario || []).map((row) => ({
      material_id: row.material_id,
      nombre: row.materiales?.nombre || "Material",
      unidad: row.materiales?.unidad_medida || "unidad",
      categoria: row.materiales?.categoria || "General",
      cantidad: Number(row.cantidad || 0),
      stock_minimo: Number(row.stock_minimo || 0),
    }));
  }, [inventario]);

  const categoriasConStock = useMemo(() => {
    const cats = new Set();
    lista.forEach(r => cats.add(r.categoria));
    return Array.from(cats).sort();
  }, [lista]);

  const listaFiltrada = useMemo(() => {
    if (filtroCategoria === "todos") return lista;
    return lista.filter(r => r.categoria === filtroCategoria);
  }, [lista, filtroCategoria]);

  const listaAgrupada = useMemo(() => {
    const map = new Map();
    listaFiltrada.forEach(row => {
      if (!map.has(row.categoria)) map.set(row.categoria, []);
      map.get(row.categoria).push(row);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [listaFiltrada]);

  const guardar = async (e) => {
    e.preventDefault();
    setFeedback("");
    const nCantidad = Number(cantidad);
    const nMin = Number(stockMinimo);
    if (!materialId) return setFeedback("Selecciona un material");
    try {
      await upsertItem({ materialId, cantidad: nCantidad, stock_minimo: nMin });
      setCantidad("");
      setFeedback("✅ Inventario actualizado");
      setTimeout(() => setFeedback(""), 3000);
    } catch (err) {
      setFeedback("❌ " + (err.message || "Error al guardar"));
    }
  };

  const crear = async (e) => {
    e.preventDefault();
    setFeedback("");
    if (!nuevoNombre.trim()) return setFeedback("Nombre requerido");
    setCreando(true);
    try {
      const mat = await crearMaterial({ nombre: nuevoNombre.trim(), unidad_medida: nuevaUnidad, categoria: nuevaCategoria });
      setNuevoNombre("");
      setMaterialId(mat.id);
      setFeedback("✅ Insumo creado");
      setTimeout(() => setFeedback(""), 3000);
    } catch (err) {
      setFeedback("❌ " + (err.message || "Error al crear"));
    } finally {
      setCreando(false);
    }
  };

  const materialesAgrupados = useMemo(() => {
    const map = new Map();
    materiales.forEach(m => {
      const cat = m.categoria || "General";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(m);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [materiales]);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <section style={{ padding: isMobile ? '1rem' : '2rem', background: '#f7f3f5', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <header className="network-nodes-bg" style={{ 
        background: 'linear-gradient(135deg, var(--dark-sidebar-start) 0%, var(--primary) 100%)', 
        borderRadius: isMobile ? '16px' : '24px', 
        padding: isMobile ? '1.5rem' : '2.5rem', 
        color: '#fff',
        marginBottom: '2.5rem',
        boxShadow: '0 20px 25px -5px var(--primary-glow)'
      }}>
        <h1 style={{ margin: 0, fontSize: isMobile ? '1.8rem' : '2.2rem', fontWeight: '800' }}>Centro Logístico</h1>
        <p style={{ margin: '8px 0 0', opacity: 0.8, fontSize: isMobile ? '0.95rem' : '1.1rem' }}>Administra el stock de materiales y suministros de tu entidad.</p>
      </header>

      {feedback && (
        <div style={{ background: feedback.includes('✅') ? '#ecfdf5' : '#fef2f2', color: feedback.includes('✅') ? '#065f46' : '#991b1b', padding: '1rem 1.5rem', borderRadius: '16px', marginBottom: '2rem', fontWeight: '700', border: '1px solid currentColor' }}>
          {feedback}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
        {/* Registro de Entrada */}
        <form onSubmit={guardar} style={{ background: '#fff', padding: '2rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 1.5rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>📦</span> Actualizar Stock
          </h3>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Material / Herramienta</label>
            <select className="minimal-select field" style={{ fontWeight: '600' }} value={materialId} onChange={(e) => setMaterialId(e.target.value)}>
              <option value="">Seleccionar del catálogo...</option>
              {materialesAgrupados.map(([cat, items]) => (
                <optgroup key={cat} label={`${CAT_ICONOS[cat] || '📦'} ${cat}`}>
                  {items.map((m) => (
                    <option key={m.id} value={m.id}>{m.nombre} ({m.unidad_medida})</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Cantidad Actual</label>
              <input type="number" className="field" style={{ minHeight: '48px' }} value={cantidad} onChange={(e) => setCantidad(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Stock de Alerta</label>
              <input type="number" className="field" style={{ minHeight: '48px' }} value={stockMinimo} onChange={(e) => setStockMinimo(e.target.value)} placeholder="10" />
            </div>
          </div>

          <button type="submit" disabled={cargando || !entidadId} style={{ width: '100%', background: 'var(--primary)', color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 6px var(--primary-glow)' }}>
            {cargando ? "Procesando..." : "Registrar Cambios"}
          </button>
        </form>

        {/* Nuevo Insumo */}
        <form onSubmit={crear} style={{ background: '#f8fafc', padding: '2rem', borderRadius: '24px', border: '2px dashed #cbd5e1' }}>
          <h3 style={{ margin: '0 0 1.5rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>✨</span> Añadir al Catálogo
          </h3>
          
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Categoría</label>
            <select className="minimal-select field" style={{ fontWeight: '600' }} value={nuevaCategoria} onChange={(e) => setNuevaCategoria(e.target.value)}>
              {CATEGORIAS_MATERIAL.map(cat => (
                <option key={cat} value={cat}>{CAT_ICONOS[cat] || '📦'} {cat}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Nombre del Material</label>
            <input className="field" style={{ minHeight: '48px' }} value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} placeholder="Ej: Pintura Vial Reflectante" />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#475569', marginBottom: '8px', textTransform: 'uppercase' }}>Unidad</label>
            <input className="field" style={{ minHeight: '48px' }} value={nuevaUnidad} onChange={(e) => setNuevaUnidad(e.target.value)} placeholder="metro, litro, kg, unidad..." />
          </div>

          <button type="submit" disabled={creando} style={{ width: '100%', background: 'var(--primary)', color: '#fff', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 6px var(--primary-glow)' }}>
            {creando ? "Creando..." : "+ Crear Nuevo Insumo"}
          </button>
        </form>
      </div>

      {/* Filtro de Categoría + Resumen */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', color: '#1e293b', fontWeight: '800', margin: 0 }}>Resumen de Existencias</h2>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFiltroCategoria("todos")}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: filtroCategoria === "todos" ? '2px solid var(--primary)' : '1px solid #e2e8f0',
              background: filtroCategoria === "todos" ? 'var(--primary)' : '#fff',
              color: filtroCategoria === "todos" ? '#fff' : '#64748b',
              fontWeight: '700',
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Todos ({lista.length})
          </button>
          {categoriasConStock.map(cat => {
            const count = lista.filter(r => r.categoria === cat).length;
            const activo = filtroCategoria === cat;
            return (
              <button
                key={cat}
                onClick={() => setFiltroCategoria(cat)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: activo ? `2px solid ${CAT_COLORES[cat] || '#94a3b8'}` : '1px solid #e2e8f0',
                  background: activo ? (CAT_COLORES[cat] || '#94a3b8') : '#fff',
                  color: activo ? '#fff' : '#475569',
                  fontWeight: '700',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{CAT_ICONOS[cat] || '📦'}</span> {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>
      
      {listaAgrupada.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8', fontWeight: '600' }}>No hay materiales registrados en esta categoría</div>
      ) : (
        listaAgrupada.map(([cat, items]) => (
          <div key={cat} style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.3rem' }}>{CAT_ICONOS[cat] || '📦'}</span>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: CAT_COLORES[cat] || '#475569' }}>{cat}</h3>
              <span style={{ fontSize: '0.75rem', fontWeight: '700', background: '#f1f5f9', padding: '4px 10px', borderRadius: '8px', color: '#64748b' }}>{items.length} {items.length === 1 ? 'material' : 'materiales'}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(250px, 100%), 1fr))', gap: '1.5rem' }}>
              {items.map((row) => {
                const esCritico = row.cantidad <= row.stock_minimo;
                return (
                  <article key={row.material_id} style={{ 
                    background: '#fff', borderRadius: '20px', padding: '1.5rem', border: `1px solid ${esCritico ? '#fee2e2' : '#e2e8f0'}`,
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
                    borderLeft: `4px solid ${CAT_COLORES[row.categoria] || '#94a3b8'}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <h4 style={{ margin: 0, color: '#1e293b' }}>{row.nombre}</h4>
                      <span style={{ fontSize: '0.7rem', fontWeight: '800', padding: '4px 10px', borderRadius: '8px', background: esCritico ? '#fef2f2' : '#f0fdf4', color: esCritico ? '#ef4444' : '#10b981' }}>
                        {esCritico ? 'CRÍTICO' : 'DISPONIBLE'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '2.5rem', fontWeight: '900', color: esCritico ? '#ef4444' : '#1e293b' }}>{row.cantidad}</span>
                      <span style={{ color: '#64748b', fontWeight: '600' }}>{row.unidad}</span>
                    </div>
                    <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>
                      Mínimo requerido: {row.stock_minimo} {row.unidad}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ))
      )}
    </section>
  );
}
