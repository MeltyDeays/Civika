import { useCallback, useEffect, useState } from "react";
import { tareasTecnicoModel } from "../Modelos/tareasModel";
import { useAuth } from "../../../modules/auth/controllers/useAuth.jsx";

/**
 * Vista de Recursos del Técnico
 * Muestra materiales asignados por denuncia.
 * Permite aceptar o solicitar recursos extra con foto.
 */
export default function RecursosView() {
  const { perfil } = useAuth();
  const [tareas, setTareas] = useState([]);
  const [recursosPorTarea, setRecursosPorTarea] = useState({});
  const [cargando, setCargando] = useState(true);

  // Solicitud extra
  const [solicitando, setSolicitando] = useState(null); // denunciaId activo
  const [catalogoMateriales, setCatalogoMateriales] = useState([]);
  const [matId, setMatId] = useState("");
  const [cantExtra, setCantExtra] = useState("");
  const [justificacion, setJustificacion] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [feedback, setFeedback] = useState("");

  const cargar = useCallback(async () => {
    if (!perfil?.id) return;
    setCargando(true);
    const res = await tareasTecnicoModel.listarAsignadas(perfil.id);
    const denuncias = res.data || [];
    setTareas(denuncias);

    // Cargar recursos de cada denuncia en paralelo (async-parallel)
    const pares = await Promise.all(
      denuncias.map(async (d) => {
        const r = await tareasTecnicoModel.listarRecursos(d.id);
        return [d.id, r.data || []];
      })
    );
    const mapa = {};
    pares.forEach(([id, recursos]) => { mapa[id] = recursos; });
    setRecursosPorTarea(mapa);

    try {
      const cat = await tareasTecnicoModel.listarMateriales();
      setCatalogoMateriales(cat);
    } catch (err) {
      console.error("Error cargando catálogo:", err);
    }

    setCargando(false);
  }, [perfil?.id]);

  useEffect(() => { cargar(); }, [cargar]);

  const enviarSolicitud = async (denunciaId) => {
    setEnviando(true);
    setFeedback("");
    try {
      let urlFoto = null;
      if (archivo) {
        urlFoto = await tareasTecnicoModel.subirFoto(archivo);
      }
      await tareasTecnicoModel.solicitarRecursoExtra({
        denunciaId,
        materialId: matId,
        cantidad: Number(cantExtra),
        justificacion,
        urlFoto,
      });
      setFeedback("Solicitud enviada. El administrador la revisará.");
      setSolicitando(null);
      setMatId(""); setCantExtra(""); setJustificacion(""); setArchivo(null);
      await cargar();
    } catch (e) {
      setFeedback(e.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="recursos-container">
      {/* Inyección de estilos responsivos premium */}
      <style dangerouslySetInnerHTML={{ __html: `
        .recursos-container {
          padding: 2rem;
          background: #f8fafc;
          min-height: 100vh;
          box-sizing: border-box;
          width: 100%;
        }
        .recursos-header {
          background: linear-gradient(135deg, #5b1125 0%, #1a0f12 50%, #0c090a 100%); 
          border-radius: 24px; 
          padding: 2.5rem; 
          color: #fff;
          margin-bottom: 2.5rem;
          box-shadow: 0 20px 40px -15px rgba(122, 24, 53, 0.25);
          box-sizing: border-box;
          border: 1px solid rgba(194, 159, 104, 0.15);
        }
        .recursos-header h1 {
          margin: 0; 
          font-size: 2.3rem; 
          font-weight: 850;
          letter-spacing: -0.8px;
          line-height: 1.2;
          background: linear-gradient(120deg, #ffffff 60%, #f3e8ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .recursos-header p {
          margin: 10px 0 0; 
          opacity: 0.85; 
          font-size: 1.05rem;
          line-height: 1.5;
          max-width: 600px;
        }
        .recursos-list-stack {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }
        .recursos-card {
          background: #ffffff;
          border-radius: 24px;
          padding: 1.75rem;
          border: 1px solid #eef2f6;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.02), 0 4px 6px -2px rgba(0,0,0,0.01);
          box-sizing: border-box;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .recursos-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 20px 30px -10px rgba(15, 23, 42, 0.05);
        }
        .recursos-card-title {
          margin: 0 0 6px;
          font-size: 1.2rem;
          font-weight: 800;
          color: #1e293b;
          line-height: 1.3;
        }
        .recursos-card-meta {
          font-size: 0.88rem;
          color: #64748b;
          font-weight: 600;
        }
        .recursos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
          margin: 1.5rem 0;
        }
        .material-item {
          padding: 1rem;
          border-radius: 18px;
          box-sizing: border-box;
          transition: all 0.2s ease;
        }
        .material-item.pendiente {
          background: #fffbeb;
          border: 1px solid #fef08a;
        }
        .material-item.aprobado {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
        }
        .material-item.rechazado {
          background: #fef2f2;
          border: 1px solid #fecaca;
        }
        .material-name {
          font-size: 0.95rem;
          font-weight: 800;
          color: #1e293b;
          display: block;
          margin-bottom: 4px;
        }
        .material-qty {
          font-size: 0.88rem;
          color: #475569;
          font-weight: 600;
        }
        .material-badge {
          font-size: 0.68rem;
          font-weight: 800;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 8px;
          display: inline-block;
          margin-top: 8px;
          letter-spacing: 0.3px;
        }
        .material-badge.pendiente {
          background: #fef08a;
          color: #a16207;
        }
        .material-badge.aprobado {
          background: #bbf7d0;
          color: #15803d;
        }
        .material-badge.rechazado {
          background: #fecaca;
          color: #dc2626;
        }
        .btn-recursos-group {
          display: flex;
          gap: 10px;
        }
        .btn-recursos-action {
          flex: 1;
          padding: 12px 20px;
          border-radius: 14px;
          border: none;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .btn-recursos-action:disabled {
          opacity: 0.75;
          cursor: not-allowed;
        }
        .solicitud-extra-panel {
          margin-top: 1.5rem;
          padding: 1.5rem;
          background: #f8fafc;
          border-radius: 20px;
          border: 1px dashed #cbd5e1;
        }
        .solicitud-extra-title {
          margin: 0 0 1rem;
          color: #5b1125;
          font-size: 1.05rem;
          font-weight: 800;
        }
        .form-field {
          width: 100%;
          padding: 12px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          font-family: inherit;
          font-size: 0.9rem;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.2s;
        }
        .form-field:focus {
          border-color: #5b1125;
        }
        @media (max-width: 900px) {
          .recursos-header {
            padding: 2.25rem 2rem;
            margin-bottom: 2rem;
          }
          .recursos-header h1 {
            font-size: 1.9rem;
            text-align: center;
          }
          .recursos-header p {
            font-size: 0.98rem;
            text-align: center;
          }
        }
        @media (max-width: 600px) {
          .recursos-container {
            padding: 1rem 0.5rem;
          }
          .recursos-header {
            padding: 1.75rem 1.25rem;
            border-radius: 20px;
            margin-bottom: 1.5rem;
          }
          .recursos-header h1 {
            font-size: 1.65rem;
          }
          .recursos-card {
            padding: 1.25rem;
            border-radius: 20px;
            margin-bottom: 1.25rem;
          }
          .recursos-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
          .btn-recursos-group {
            flex-direction: column;
            gap: 8px;
          }
          .btn-recursos-action {
            width: 100%;
            padding: 11px 16px;
            font-size: 0.85rem;
          }
        }
      `}} />

      <header className="recursos-header">
        <div>
          <h1>Recursos Asignados</h1>
          <p>Materiales e insumos para tus reparaciones activas. Revisa, acepta o genera solicitudes adicionales.</p>
        </div>
      </header>

      {cargando && <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b', fontWeight: '700' }}>Cargando recursos operativos...</div>}
      {feedback && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', fontWeight: '600' }}>{feedback}</div>}

      <div className="recursos-list-stack">
        {tareas.map((tarea) => {
          const recursos = recursosPorTarea[tarea.id] || [];
          return (
            <article key={tarea.id} className="recursos-card">
              <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '14px' }}>
                <h3 className="recursos-card-title">{tarea.titulo}</h3>
                <small className="recursos-card-meta">📍 {tarea.municipio} · {tarea.categoria}</small>
              </div>

              {/* Cards de materiales */}
              {recursos.length > 0 ? (
                <div className="recursos-grid">
                  {recursos.map((r) => {
                    const esExtra = r.estado_solicitud === "pendiente_revision";
                    const aprobado = r.estado_solicitud === "aprobada";
                    const tipoClase = esExtra ? "pendiente" : aprobado ? "aprobado" : "rechazado";
                    return (
                      <div key={r.id} className={`material-item ${tipoClase}`}>
                        <strong className="material-name">
                          {r.materiales?.nombre || "Material"}
                        </strong>
                        <span className="material-qty">
                          {r.cantidad_asignada} {r.materiales?.unidad_medida || "und"}
                        </span>
                        <div>
                          <span className={`material-badge ${tipoClase}`}>
                            {r.estado_solicitud === "aprobada" ? "Aprobado" : r.estado_solicitud === "pendiente_revision" ? "Pendiente" : "Rechazado"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>Sin materiales asignados aún para esta obra.</p>
              )}

              {/* Botones */}
              <div className="btn-recursos-group">
                <button className="btn-recursos-action" style={{ background: '#ecfdf5', color: '#10b981' }} disabled>
                  ✓ Recursos Aceptados
                </button>
                <button className="btn-recursos-action" style={{ background: '#5b1125', color: '#fff' }}
                  onClick={() => setSolicitando(solicitando === tarea.id ? null : tarea.id)}>
                  📦 Solicitar Adicionales
                </button>
              </div>

              {/* Formulario de solicitud extra */}
              {solicitando === tarea.id && (
                <div className="solicitud-extra-panel">
                  <h4 className="solicitud-extra-title">Solicitar material adicional</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <select className="form-field" value={matId} onChange={(e) => setMatId(e.target.value)}>
                      <option value="">-- Seleccionar Material --</option>
                      {catalogoMateriales.map((m) => (
                        <option key={m.id} value={m.id}>{m.nombre} ({m.unidad_medida})</option>
                      ))}
                    </select>
                    <input className="form-field" type="number" placeholder="Cantidad necesaria" min="1"
                      value={cantExtra} onChange={(e) => setCantExtra(e.target.value)} />
                    <textarea className="form-field" placeholder="Justificación: ¿Por qué necesitas más?"
                      value={justificacion} onChange={(e) => setJustificacion(e.target.value)} rows={3} />
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>
                        📸 Evidencia fotográfica
                      </label>
                      <input type="file" accept="image/*" capture="environment" style={{ fontSize: '0.85rem' }}
                        onChange={(e) => setArchivo(e.target.files?.[0] || null)} />
                    </div>
                    <button className="btn-recursos-action" style={{ background: '#5b1125', color: '#fff' }} disabled={enviando || !matId || !cantExtra}
                      onClick={() => enviarSolicitud(tarea.id)}>
                      {enviando ? "Enviando..." : "Enviar solicitud"}
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
