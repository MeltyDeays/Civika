import { useMemo, useState } from "react";
import { useAuth } from "../../../modules/auth/controllers/useAuth.jsx";
import { useEstadisticasMateriales } from "../Controladores/useEstadisticasMateriales";

const PRIORIDAD_DETALLES = {
  critica: { nombre: "Crítica", color: "#ef4444", bg: "#fef2f2" },
  alta: { nombre: "Alta", color: "#f59e0b", bg: "#fffbeb" },
  media: { nombre: "Media", color: "#3b82f6", bg: "#eff6ff" },
  baja: { nombre: "Baja", color: "#10b981", bg: "#f0fdf4" },
  sin_prioridad: { nombre: "Sin Prioridad", color: "#94a3b8", bg: "#f8fafc" }
};

export default function EstadisticasMaterialesView() {
  const { perfil } = useAuth();
  const entidadId = perfil?.id_entidad;
  const { cpgData, idlData, empData, edaData, inventarioData, cargando, error, recargar } = useEstadisticasMateriales(entidadId);
  const [categoriaFiltro, setCategoriaFiltro] = useState("todos");
  const [categoriaMaterialFiltro, setCategoriaMaterialFiltro] = useState("todos");

  const categoriasUnicas = useMemo(() => {
    const cats = new Set();
    cpgData.forEach(row => { if (row.categoria) cats.add(row.categoria); });
    empData.forEach(row => { if (row.categoria) cats.add(row.categoria); });
    edaData.forEach(row => { if (row.categoria) cats.add(row.categoria); });
    return Array.from(cats).sort();
  }, [cpgData, empData, edaData]);

  const categoriasMaterialesUnicas = useMemo(() => {
    const cats = new Set();
    (inventarioData || []).forEach(row => {
      const cat = row.materiales?.categoria;
      if (cat) cats.add(cat);
    });
    return Array.from(cats).sort();
  }, [inventarioData]);

  const cpgFiltrado = useMemo(() => {
    return cpgData.filter(row => {
      const matchProblema = categoriaFiltro === "todos" || row.categoria === categoriaFiltro;
      const matchMaterial = categoriaMaterialFiltro === "todos" || row.material_categoria === categoriaMaterialFiltro;
      return matchProblema && matchMaterial;
    });
  }, [cpgData, categoriaFiltro, categoriaMaterialFiltro]);

  const materialIdsDeCategoria = useMemo(() => {
    if (categoriaFiltro === "todos") return null;
    const ids = new Set();
    cpgData
      .filter(row => row.categoria === categoriaFiltro)
      .forEach(row => ids.add(row.material_id));
    return ids;
  }, [cpgData, categoriaFiltro]);

  const idlFiltrado = useMemo(() => {
    return idlData.filter(row => {
      const matchProblema = !materialIdsDeCategoria || materialIdsDeCategoria.has(row.material_id);
      const matchMaterial = categoriaMaterialFiltro === "todos" || row.material_categoria === categoriaMaterialFiltro;
      return matchProblema && matchMaterial;
    });
  }, [idlData, materialIdsDeCategoria, categoriaMaterialFiltro]);

  const empFiltrado = useMemo(() => {
    return empData.filter(row => {
      const matchProblema = categoriaFiltro === "todos" || row.categoria === categoriaFiltro;
      const matchMaterial = categoriaMaterialFiltro === "todos" || row.material_categoria === categoriaMaterialFiltro;
      return matchProblema && matchMaterial;
    });
  }, [empData, categoriaFiltro, categoriaMaterialFiltro]);

  const edaFiltrado = useMemo(() => {
    return edaData.filter(row => {
      const matchProblema = categoriaFiltro === "todos" || row.categoria === categoriaFiltro;
      const matchMaterial = categoriaMaterialFiltro === "todos" || row.material_categoria === categoriaMaterialFiltro;
      return matchProblema && matchMaterial;
    });
  }, [edaData, categoriaFiltro, categoriaMaterialFiltro]);

  // Cálculos globales para los KPIs del Header / Resumen
  const kpisGlobales = useMemo(() => {
    let maxIdl = 0;
    let materialCritico = "";
    idlFiltrado.forEach(row => {
      const val = Number(row.idl_porcentaje || 0);
      if (val > maxIdl) {
        maxIdl = val;
        materialCritico = row.material_nombre;
      }
    });

    const materialesCritico = {};
    const materialesBaja = {};
    cpgFiltrado.forEach(row => {
      const mat = row.material_nombre;
      if (row.prioridad === "critica") {
        materialesCritico[mat] = Number(row.promedio_cantidad || 0);
      } else if (row.prioridad === "baja") {
        materialesBaja[mat] = Number(row.promedio_cantidad || 0);
      }
    });

    const multiplicadoresValidos = [];
    Object.keys(materialesCritico).forEach(mat => {
      if (materialesBaja[mat] > 0) {
        multiplicadoresValidos.push(materialesCritico[mat] / materialesBaja[mat]);
      }
    });

    const multiplicador = multiplicadoresValidos.length > 0
      ? (multiplicadoresValidos.reduce((a, b) => a + b, 0) / multiplicadoresValidos.length)
      : 2.2;

    const totalPendiente = empFiltrado.reduce((acc, row) => acc + Number(row.cantidad_estimada || 0), 0);

    let consumoRetrasado = 0;
    let muestrasRetrasadas = 0;
    let consumoATiempo = 0;
    let muestrasATiempo = 0;
    edaFiltrado.forEach(row => {
      if (row.grupo_atencion?.includes("Retrasado")) {
        consumoRetrasado += Number(row.promedio_consumo || 0) * Number(row.muestras || 0);
        muestrasRetrasadas += Number(row.muestras || 0);
      } else {
        consumoATiempo += Number(row.promedio_consumo || 0) * Number(row.muestras || 0);
        muestrasATiempo += Number(row.muestras || 0);
      }
    });
    const avgRetrasado = muestrasRetrasadas > 0 ? (consumoRetrasado / muestrasRetrasadas) : 0;
    const avgATiempo = muestrasATiempo > 0 ? (consumoATiempo / muestrasATiempo) : 0;
    const incrementoRetraso = avgATiempo > 0 ? ((avgRetrasado - avgATiempo) / avgATiempo) * 100 : 0;

    return {
      maxIdl,
      materialCritico,
      multiplicador,
      totalPendiente,
      incrementoRetraso,
      hasRetraso: muestrasRetrasadas > 0
    };
  }, [cpgFiltrado, idlFiltrado, empFiltrado, edaFiltrado]);

  // Agrupación de CPG por material para renderizar tarjetas consolidadas
  const cpgAgrupado = useMemo(() => {
    const map = new Map();
    cpgFiltrado.forEach(row => {
      const key = row.material_nombre;
      if (!map.has(key)) {
        map.set(key, {
          nombre: row.material_nombre,
          unidad: row.unidad_medida,
          valores: {}
        });
      }
      map.get(key).valores[row.prioridad] = {
        promedio: Number(row.promedio_cantidad || 0),
        muestras: Number(row.total_reportes || 0)
      };
    });
    return Array.from(map.values());
  }, [cpgFiltrado]);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <section style={{ padding: isMobile ? '1rem' : '2rem', background: '#f7f3f5', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* HEADER PREMIUM */}
      <header className="network-nodes-bg" style={{ 
        background: 'linear-gradient(135deg, var(--dark-sidebar-start) 0%, var(--primary) 100%)', 
        borderRadius: isMobile ? '16px' : '24px', 
        padding: isMobile ? '1.5rem' : '2.5rem', 
        color: '#fff',
        marginBottom: '2rem',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: '1.5rem',
        boxShadow: '0 10px 25px -5px var(--primary-glow)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.8rem' }}>📊</span>
            <h1 style={{ margin: 0, fontSize: isMobile ? '1.8rem' : '2.2rem', fontWeight: '800', letterSpacing: '-0.025em' }}>
              Consumo de Insumos & Desgaste de Inventario
            </h1>
          </div>
          <p style={{ margin: '8px 0 0', opacity: 0.8, fontSize: isMobile ? '0.95rem' : '1.05rem', fontWeight: '400' }}>
            Análisis táctico de la relación entre la gravedad de reportes y el ritmo de consumo logístico.
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: isMobile ? 'stretch' : 'center', gap: '12px', flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: '800', opacity: 0.9, textTransform: 'uppercase' }}>Categoría Reporte</label>
            <select 
              className="minimal-select field"
              style={{ 
                minHeight: '42px', 
                padding: '0 2.5rem 0 1rem', 
                width: 'auto', 
                minWidth: '180px', 
                color: '#1e293b',
                fontWeight: '600'
              }}
              value={categoriaFiltro} 
              onChange={(e) => setCategoriaFiltro(e.target.value)}
            >
              <option value="todos">Todas las categorías</option>
              {categoriasUnicas.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {categoriasMaterialesUnicas.length > 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '800', opacity: 0.9, textTransform: 'uppercase' }}>Categoría Material</label>
              <select 
                className="minimal-select field"
                style={{ 
                  minHeight: '42px', 
                  padding: '0 2.5rem 0 1rem', 
                  width: 'auto', 
                  minWidth: '180px', 
                  color: '#1e293b',
                  fontWeight: '600'
                }}
                value={categoriaMaterialFiltro} 
                onChange={(e) => setCategoriaMaterialFiltro(e.target.value)}
              >
                <option value="todos">Todos los materiales</option>
                {categoriasMaterialesUnicas.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          <button 
            onClick={recargar}
            style={{
              alignSelf: isMobile ? 'stretch' : 'flex-end',
              height: '42px',
              padding: '0 16px',
              borderRadius: '12px',
              background: '#fff',
              color: 'var(--primary)',
              border: 'none',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 6px var(--primary-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Recargar Métricas"
          >
            🔄 Recargar
          </button>
        </div>
      </header>

      {error && (
        <div style={{ padding: '1rem 2rem', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '16px', color: '#991b1b', marginBottom: '2rem', fontWeight: '600' }}>
          ⚠️ Error al cargar métricas: {error}
        </div>
      )}

      {cargando ? (
        <div style={{ textAlign: 'center', padding: '6rem 0' }}>
          <div style={{
            display: 'inline-block',
            width: '40px',
            height: '40px',
            border: '4px solid rgba(15,23,42,0.1)',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '1rem'
          }}></div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <div style={{ color: '#64748b', fontWeight: '700', fontSize: '1.1rem' }}>Procesando base de datos relacional...</div>
        </div>
      ) : (
        <>
          {/* CARDS DE RESUMEN EJECUTIVO (KPIs de Alto Impacto) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            
            {/* KPI 1: IDL Máximo */}
            <article style={{ background: '#fff', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 4px 10px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Desgaste Crítico Almacén</span>
                <span style={{ fontSize: '1.5rem' }}>⚠️</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '900', color: kpisGlobales.maxIdl > 80 ? '#ef4444' : '#0f172a' }}>
                {Math.round(kpisGlobales.maxIdl)}%
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px', fontWeight: '600' }}>
                {kpisGlobales.maxIdl > 0 ? (
                  <>Material crítico: <strong style={{ color: '#0f172a' }}>{kpisGlobales.materialCritico}</strong></>
                ) : "Sin solicitudes de material recientes"}
              </div>
              {kpisGlobales.maxIdl > 80 && (
                <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: '#fee2e2', color: '#ef4444', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '6px', fontWeight: '800' }}>STOCK EN ALERTA</div>
              )}
            </article>

            {/* KPI 2: Multiplicador Crítico */}
            <article style={{ background: '#fff', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 4px 10px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Presión por Gravedad</span>
                <span style={{ fontSize: '1.5rem' }}>⚡</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '900', color: '#0f172a' }}>
                {kpisGlobales.multiplicador > 0 ? `${kpisGlobales.multiplicador.toFixed(1)}x` : 'N/A'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px', fontWeight: '600' }}>
                Un reporte <strong style={{ color: '#ef4444' }}>Crítico</strong> consume en promedio {kpisGlobales.multiplicador > 0 ? `${kpisGlobales.multiplicador.toFixed(1)} veces más` : "lo mismo"} que uno <strong style={{ color: '#10b981' }}>Bajo</strong>.
              </div>
            </article>

            {/* KPI 3: Total Material Proyectado */}
            <article style={{ background: '#fff', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 4px 10px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Backlog Proyectado (EMP)</span>
                <span style={{ fontSize: '1.5rem' }}>📦</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '900', color: '#3b82f6' }}>
                {Math.round(kpisGlobales.totalPendiente).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px', fontWeight: '600' }}>
                Unidades estimadas totales para solventar el inventario de reportes en cola <strong style={{ color: '#0f172a' }}>"Pendiente"</strong>.
              </div>
            </article>

            {/* KPI 4: Incremento por retraso */}
            <article style={{ background: '#fff', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 4px 10px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pérdida por Retraso</span>
                <span style={{ fontSize: '1.5rem' }}>⏱️</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '900', color: kpisGlobales.hasRetraso && kpisGlobales.incrementoRetraso > 0 ? '#ea580c' : '#10b981' }}>
                {kpisGlobales.hasRetraso && kpisGlobales.incrementoRetraso > 0 ? `+${Math.round(kpisGlobales.incrementoRetraso)}%` : '0%'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px', fontWeight: '600' }}>
                {kpisGlobales.hasRetraso && kpisGlobales.incrementoRetraso > 0 ? (
                  <>Sobreconsumo de recursos al demorar más de 15 días en estado <strong style={{ color: '#0f172a' }}>"Pendiente"</strong>.</>
                ) : (
                  <><span style={{ color: '#10b981' }}>Eficiencia Óptima</span>: El 100% de los reportes se inician a tiempo sin sobrecostos logísticos.</>
                )}
              </div>
            </article>
          </div>

          {/* CUADRICULA DE REPORTES E INTERFACES GRAFICAS */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            
            {/* PANEL 1: CPG (Consumo Promedio por Gravedad) */}
            <section style={{ background: '#fff', borderRadius: '24px', padding: '2rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.01)' }}>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '1.3rem', fontWeight: '800', color: '#0f172a' }}>Consumo Promedio por Gravedad (CPG)</h2>
              <p style={{ margin: '0 0 1.5rem 0', color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>
                Relación de volumen físico de insumos requerido según la criticidad asignada a la incidencia.
              </p>

              {cpgAgrupado.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontWeight: '600' }}>No hay registros CPG disponibles en este filtro</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {cpgAgrupado.map(material => {
                    const maxVal = Math.max(
                      material.valores.critica?.promedio || 0,
                      material.valores.alta?.promedio || 0,
                      material.valores.media?.promedio || 0,
                      material.valores.baja?.promedio || 0
                    ) || 1;

                    return (
                      <div key={material.nombre} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{ fontWeight: '750', color: '#1e293b', fontSize: '1.05rem' }}>{material.nombre}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: '800', background: '#e2e8f0', padding: '4px 8px', borderRadius: '6px', color: '#475569', textTransform: 'uppercase' }}>
                            Unidad: {material.unidad}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {['critica', 'alta', 'media', 'baja'].map(prioridad => {
                            const val = material.valores[prioridad];
                            if (!val) return null;
                            const pct = (val.promedio / maxVal) * 100;
                            const det = PRIORIDAD_DETALLES[prioridad];

                            return (
                              <div key={prioridad} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '60px', fontSize: '0.8rem', fontWeight: '700', color: det.color, textTransform: 'capitalize' }}>
                                  {det.nombre}
                                </div>
                                <div style={{ flex: 1, background: '#f1f5f9', height: '14px', borderRadius: '7px', overflow: 'hidden', position: 'relative' }}>
                                  <div style={{ width: `${pct}%`, background: det.color, height: '100%', borderRadius: '7px', transition: 'width 0.5s ease-out' }}></div>
                                </div>
                                <div style={{ width: '90px', textAlign: 'right', fontSize: '0.85rem', fontWeight: '800', color: '#0f172a' }}>
                                  {val.promedio} <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>{material.unidad}</span>
                                </div>
                                <div style={{ width: '40px', textAlign: 'right', fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700' }}>
                                  ({val.muestras} m.)
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* PANEL 2: EDA (Correlación Temporal vs. Consumo) */}
            <section style={{ background: '#fff', borderRadius: '24px', padding: '2rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.01)' }}>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '1.3rem', fontWeight: '800', color: '#0f172a' }}>Correlación Temporal vs. Consumo (EDA)</h2>
              <p style={{ margin: '0 0 1.5rem 0', color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>
                Comparación del consumo promedio de materiales en reportes atendidos a tiempo (≤ 15 días en Kanban) vs. retrasados (&gt; 15 días).
              </p>

              {edaFiltrado.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', background: '#f8fafc', borderRadius: '20px', border: '2px dashed #cbd5e1' }}>
                  <span style={{ fontSize: '2.5rem' }}>🛡️</span>
                  <h4 style={{ margin: '12px 0 4px 0', color: '#0f172a', fontWeight: '800' }}>Eficiencia Operativa Óptima</h4>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem', lineHeight: '1.4' }}>
                    El 100% de los reportes históricos han sido abordados por las cuadrillas antes del umbral crítico de 15 días en pendiente, previniendo el agravamiento estructural y el sobreconsumo de insumos.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {/* Agrupamos por material para ver la comparativa visual lado a lado */}
                  {(() => {
                    const materialMap = new Map();
                    edaFiltrado.forEach(row => {
                      const key = row.material_nombre;
                      if (!materialMap.has(key)) {
                        materialMap.set(key, {
                          nombre: row.material_nombre,
                          unidad: row.unidad_medida,
                          aTiempo: null,
                          retrasado: null
                        });
                      }
                      const obj = materialMap.get(key);
                      if (row.grupo_atencion?.includes("A tiempo")) {
                        obj.aTiempo = Number(row.promedio_consumo || 0);
                      } else {
                        obj.retrasado = Number(row.promedio_consumo || 0);
                      }
                    });

                    return Array.from(materialMap.values()).map(mat => {
                      const maxVal = Math.max(mat.aTiempo || 0, mat.retrasado || 0) || 1;
                      const pctA = ((mat.aTiempo || 0) / maxVal) * 100;
                      const pctR = ((mat.retrasado || 0) / maxVal) * 100;

                      return (
                        <div key={mat.nombre} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '1.5rem' }}>
                          <div style={{ fontWeight: '750', color: '#1e293b', marginBottom: '14px', fontSize: '1rem' }}>
                            {mat.nombre}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {/* Barra A tiempo */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '130px', fontSize: '0.8rem', fontWeight: '750', color: '#10b981' }}>
                                A tiempo (≤ 15d)
                              </div>
                              <div style={{ flex: 1, background: '#f1f5f9', height: '14px', borderRadius: '7px' }}>
                                <div style={{ width: `${pctA}%`, background: '#10b981', height: '100%', borderRadius: '7px' }}></div>
                              </div>
                              <div style={{ width: '80px', textAlign: 'right', fontSize: '0.85rem', fontWeight: '800', color: '#0f172a' }}>
                                {mat.aTiempo ? `${mat.aTiempo} ${mat.unidad}` : '0'}
                              </div>
                            </div>

                            {/* Barra Retrasado */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '130px', fontSize: '0.8rem', fontWeight: '750', color: '#ef4444' }}>
                                Retrasado (&gt; 15d)
                              </div>
                              <div style={{ flex: 1, background: '#f1f5f9', height: '14px', borderRadius: '7px' }}>
                                <div style={{ width: `${pctR}%`, background: '#ef4444', height: '100%', borderRadius: '7px' }}></div>
                              </div>
                              <div style={{ width: '80px', textAlign: 'right', fontSize: '0.85rem', fontWeight: '800', color: '#0f172a' }}>
                                {mat.retrasado ? `${mat.retrasado} ${mat.unidad}` : 'Sin retrasos'}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </section>
          </div>

          {/* FILA 2: IDL (ÍNDICE DE DESGASTE LOGÍSTICO) */}
          <section style={{ background: '#fff', borderRadius: '24px', padding: '2rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.01)', marginBottom: '2rem' }}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '1.3rem', fontWeight: '800', color: '#0f172a' }}>Índice de Desgaste Logístico (IDL)</h2>
            <p style={{ margin: '0 0 1.5rem 0', color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>
              Porcentaje del almacén consumido en los últimos 30 días en relación al stock actual acumulado.
            </p>

            {idlFiltrado.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontWeight: '600' }}>No hay registros de consumo en los últimos 30 días</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '12px 16px' }}>Material</th>
                      <th style={{ padding: '12px 16px' }}>Stock Mínimo</th>
                      <th style={{ padding: '12px 16px' }}>Stock Actual</th>
                      <th style={{ padding: '12px 16px' }}>Consumo 30d</th>
                      <th style={{ padding: '12px 16px', width: '30%' }}>Presión del Almacén (IDL)</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Estado Almacén</th>
                    </tr>
                  </thead>
                  <tbody>
                    {idlFiltrado.map(row => {
                      const idlPct = Number(row.idl_porcentaje || 0);
                      const isLowStock = Number(row.stock_actual) < Number(row.stock_minimo);
                      
                      let idlColor = '#10b981';
                      if (idlPct > 75) idlColor = '#ef4444';
                      else if (idlPct > 40) idlColor = '#f59e0b';

                      return (
                        <tr key={row.material_id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem', fontWeight: '600' }}>
                          <td style={{ padding: '16px', fontWeight: '750', color: '#0f172a' }}>{row.material_nombre}</td>
                          <td style={{ padding: '16px', color: '#64748b' }}>{row.stock_minimo} {row.unidad_medida}</td>
                          <td style={{ padding: '16px', color: isLowStock ? '#ef4444' : '#0f172a', fontWeight: isLowStock ? '750' : '600' }}>
                            {row.stock_actual} {row.unidad_medida}
                          </td>
                          <td style={{ padding: '16px', color: '#0f172a' }}>{row.consumido_mes} {row.unidad_medida}</td>
                          <td style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ width: '45px', fontWeight: '800', color: idlColor }}>{Math.round(idlPct)}%</span>
                              <div style={{ flex: 1, background: '#f1f5f9', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                                <div style={{ width: `${Math.min(idlPct, 100)}%`, background: idlColor, height: '100%', borderRadius: '5px' }}></div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px', textAlign: 'right' }}>
                            {isLowStock ? (
                              <span style={{ background: '#fee2e2', color: '#ef4444', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800' }}>
                                REABASTECER
                              </span>
                            ) : (
                              <span style={{ background: '#f0fdf4', color: '#10b981', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800' }}>
                                DISPONIBLE
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* FILA 3: EMP (ESTIMACIÓN DE MATERIAL PENDIENTE) */}
          <section style={{ background: '#fff', borderRadius: '24px', padding: '2rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.01)' }}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '1.3rem', fontWeight: '800', color: '#0f172a' }}>Estimación de Material Pendiente (EMP)</h2>
            <p style={{ margin: '0 0 1.5rem 0', color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>
              Proyección algorítmica de insumos necesarios para solventar los reportes actualmente en cola ("Pendiente") agrupados por categoría.
            </p>

            {empFiltrado.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', fontWeight: '600' }}>No hay reportes pendientes que proyectar en este filtro</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(250px, 100%), 1fr))', gap: '1.5rem' }}>
                {empFiltrado.map(row => (
                  <article key={`${row.categoria}-${row.material_nombre}`} style={{ background: '#f8fafc', borderRadius: '18px', padding: '1.25rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', background: '#3b82f61a', color: '#3b82f6', padding: '4px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                          {row.categoria}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: '750', color: '#64748b' }}>
                          {row.cantidad_pendientes} {Number(row.cantidad_pendientes) === 1 ? 'Reporte' : 'Reportes'}
                        </span>
                      </div>
                      <h4 style={{ margin: '4px 0 12px 0', fontSize: '1.1rem', fontWeight: '800', color: '#0f172a' }}>{row.material_nombre}</h4>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px dashed #cbd5e1', paddingTop: '10px', marginTop: '6px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '700' }}>Proyección Requerida:</span>
                      <span style={{ fontSize: '1.3rem', fontWeight: '900', color: '#0f172a' }}>
                        {row.cantidad_estimada} <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>{row.unidad_medida}</span>
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}
