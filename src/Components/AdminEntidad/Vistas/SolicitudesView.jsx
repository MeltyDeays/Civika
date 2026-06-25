import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../core/supabaseClient";
import { useAuth } from "../../../modules/auth/controllers/useAuth.jsx";

export default function SolicitudesView() {
  const { perfil } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState("");

  const entidadId = perfil?.id_entidad;

  const cargar = useCallback(async () => {
    if (!entidadId) return;
    setCargando(true);

    const { data } = await supabase
      .from("recursos_asignados")
      .select(`
        id,id_denuncia,id_material,cantidad_asignada,estado_solicitud,
        justificacion_extra,url_foto_justificacion,creado_el,
        materiales(id,nombre,unidad_medida),
        denuncias!inner(id,titulo,municipio,entidad_id)
      `)
      .eq("estado_solicitud", "pendiente_revision")
      .eq("denuncias.entidad_id", entidadId)
      .order("creado_el", { ascending: false });

    setSolicitudes(data || []);
    setCargando(false);
  }, [entidadId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      cargar();
    }, 0);
    return () => clearTimeout(timer);
  }, [cargar]);

  const decidir = async (solicitudId, decision) => {
    setProcesando(solicitudId);
    const { error } = await supabase
      .from("recursos_asignados")
      .update({ estado_solicitud: decision })
      .eq("id", solicitudId);

    if (!error) {
      setSolicitudes((prev) => prev.filter((s) => s.id !== solicitudId));
    }
    setProcesando("");
  };

  return (
    <section style={{ padding: '2rem', background: '#f8fafc', minHeight: '100vh' }}>
      <header style={{ 
        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', 
        borderRadius: '24px', 
        padding: '2.5rem', 
        color: '#fff',
        marginBottom: '2.5rem',
        boxShadow: '0 20px 25px -5px rgba(249,115,22,0.2)'
      }}>
        <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: '800' }}>Solicitudes de Recursos</h1>
        <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: '1.1rem' }}>Autoriza materiales adicionales solicitados por los técnicos en campo.</p>
      </header>

      {cargando && (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
          <div className="spinner"></div>
          <p style={{ color: '#64748b', fontWeight: '600', marginTop: '1rem' }}>Sincronizando solicitudes...</p>
        </div>
      )}

      {!cargando && solicitudes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '5rem', background: '#fff', borderRadius: '24px', border: '1px dashed #cbd5e1' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>✅</div>
          <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.5rem' }}>Todo al día</h3>
          <p style={{ color: '#64748b' }}>No hay solicitudes de materiales pendientes de revisión.</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2rem' }}>
        {solicitudes.map((sol) => (
          <article key={sol.id} style={{ 
            background: '#fff', borderRadius: '24px', overflow: 'hidden', border: '1px solid #e2e8f0',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#f97316', textTransform: 'uppercase', marginBottom: '4px' }}>Proyecto</div>
              <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.2rem' }}>{sol.denuncias?.titulo}</h3>
              <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600' }}>📍 {sol.denuncias?.municipio}</div>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem' }}>
              {sol.url_foto_justificacion ? (
                <img src={sol.url_foto_justificacion} alt="Evidencia" style={{ width: '140px', height: '140px', objectFit: 'cover', borderRadius: '16px' }} />
              ) : (
                <div style={{ width: '140px', height: '140px', background: '#f8fafc', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #cbd5e1', color: '#94a3b8', fontSize: '0.8rem' }}>Sin evidencia</div>
              )}

              <div style={{ flex: 1 }}>
                <div style={{ background: '#fff7ed', padding: '12px', borderRadius: '12px', marginBottom: '12px', border: '1px solid #ffedd5' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#c2410c' }}>
                    {sol.cantidad_asignada} {sol.materiales?.unidad_medida}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#9a3412' }}>{sol.materiales?.nombre}</div>
                </div>
                <div style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5 }}>
                  <strong>Justificación:</strong> {sol.justificacion_extra || "No proporcionada"}
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => decidir(sol.id, "aprobada")}
                disabled={procesando === sol.id}
                style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}
              >✓ Aprobar</button>
              <button 
                onClick={() => decidir(sol.id, "rechazada")}
                disabled={procesando === sol.id}
                style={{ flex: 1, background: '#fff', color: '#ef4444', border: '1px solid #fee2e2', padding: '12px', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}
              >✕ Rechazar</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
