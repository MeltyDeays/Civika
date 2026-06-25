import { useEffect, useState, useRef } from "react";
import { CATEGORIAS_REPORTE, DEPARTAMENTOS_NICARAGUA } from "../utils/constants";
import { uploadFile } from "../services/storageService";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { supabase } from "../core/supabaseClient";

import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

function LocationMarker({ position, setPosition, onFix }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 16, { duration: 1.5 });
    }
  }, [position, map]);
  
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      if (onFix) onFix();
    },
  });
  return position === null ? null : <Marker position={position}></Marker>;
}

const FORMULARIO_VACIO = { 
  titulo: "", 
  descripcion: "", 
  problematica_id: "", 
  url_imagen: "", 
  lat: "", 
  lng: "",
  direccion: "",
  departamento: "",
  municipio: "",
  prioridad: "media"
};

export default function ModalFormularioReporte({ abierto, modo, reporteInicial, alCerrar, alGuardar }) {
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [calibrandoGps, setCalibrandoGps] = useState(false);
  const [mapPosition, setMapPosition] = useState(null);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [ubicacionFijada, setUbicacionFijada] = useState(false);
  const [problematicas, setProblematicas] = useState([]);
  
  const fileInputRef = useRef(null);

  const reporteInicialId = reporteInicial?.id;

  useEffect(() => {
    if (!abierto) return;
    if (!reporteInicial) {
      setFormulario(FORMULARIO_VACIO);
      setMapPosition(null);
      setUbicacionFijada(false);
      return;
    }
    setFormulario({
      titulo: reporteInicial.titulo || "",
      descripcion: reporteInicial.descripcion || "",
      problematica_id: reporteInicial.problematica_id || "",
      url_imagen: reporteInicial.url_imagen || "",
      lat: reporteInicial.lat ?? "",
      lng: reporteInicial.lng ?? "",
      direccion: reporteInicial.direccion || "",
      departamento: reporteInicial.departamento || "",
      municipio: reporteInicial.municipio || "",
      prioridad: reporteInicial.prioridad || "media"
    });
    if (reporteInicial.lat && reporteInicial.lng) {
      setMapPosition({ lat: parseFloat(reporteInicial.lat), lng: parseFloat(reporteInicial.lng) });
      setUbicacionFijada(true);
    } else {
      setMapPosition(null);
      setUbicacionFijada(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, reporteInicialId]);

  useEffect(() => {
    if (mapPosition) {
      setFormulario((prev) => {
        if (prev.lat === mapPosition.lat && prev.lng === mapPosition.lng) return prev;
        return { ...prev, lat: mapPosition.lat, lng: mapPosition.lng };
      });
    }
  }, [mapPosition]);

  useEffect(() => {
    async function loadProblematicas() {
      const { data } = await supabase.from('problematicas').select('*');
      if (data) {
        setProblematicas(data);
        if (data.length > 0 && formulario.problematica_id === "") {
          setFormulario(prev => ({ ...prev, problematica_id: data[0].id }));
        }
      }
    }
    loadProblematicas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!abierto) return null;

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormulario(prev => {
      const nuevo = { ...prev, [name]: value };
      if (name === "departamento") nuevo.municipio = "";
      return nuevo;
    });
  };

  const manejarArchivo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSubiendoImagen(true);
    try {
      const url = await uploadFile("fotos", file);
      setFormulario(prev => ({ ...prev, url_imagen: url }));
    } catch (err) {
      alert("Error subiendo imagen: " + err.message);
    } finally {
      setSubiendoImagen(false);
    }
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (!formulario.url_imagen) {
      setError("La evidencia fotográfica es obligatoria para reportar una incidencia y evitar reportes falsos.");
      return;
    }
    if (!mapPosition) {
      setError("Por favor, marca la ubicación en el mapa.");
      return;
    }
    setError("");
    setGuardando(true);
    try {
      await alGuardar(formulario);
      alCerrar();
    } catch (err) {
      setError(err.message || "Error al guardar.");
    } finally {
      setGuardando(false);
    }
  };

  const departamentos = Object.keys(DEPARTAMENTOS_NICARAGUA);
  const municipios = formulario.departamento ? DEPARTAMENTOS_NICARAGUA[formulario.departamento].municipios : [];

  return (
    <div className="modal-backdrop" onClick={alCerrar} style={{ backdropFilter: 'blur(12px)', padding: '1rem', background: 'rgba(15, 23, 42, 0.7)' }}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ 
        width: 'min(900px, 100%)', padding: '0', overflow: 'hidden', borderRadius: '32px', maxHeight: '95vh', 
        display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', border: '1px solid rgba(255,255,255,0.1)' 
      }}>
        
        {/* Header Premium */}
        <div style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', padding: '2rem', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', letterSpacing: '-0.5px' }}>{modo === "editar" ? "Editar Reporte" : "Nueva Denuncia"}</h2>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.95rem' }}>Proporciona detalles precisos para una resolución efectiva.</p>
          </div>
          <button onClick={alCerrar} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer', fontSize: '1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={manejarEnvio} style={{ padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem', background: '#fff' }}>
          
          {/* Subida de Imagen */}
          <div className="input-group">
            <span className="label-premium" style={{ display: 'block', marginBottom: '12px', fontWeight: '800', color: '#1e293b', fontSize: '0.9rem', textTransform: 'uppercase' }}>Evidencia Fotográfica *</span>
            <div 
              onClick={() => fileInputRef.current.click()}
              style={{ 
                width: '100%', height: '260px', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '24px', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', 
                overflow: 'hidden', position: 'relative', transition: 'all 0.3s' 
              }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = '#2563eb'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
            >
              {formulario.url_imagen ? (
                <img src={formulario.url_imagen} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <>
                  <div style={{ fontSize: '56px', marginBottom: '12px' }}>📸</div>
                  <span style={{ fontWeight: '700', color: '#475569' }}>{subiendoImagen ? "Subiendo archivo..." : "Capturar o subir imagen"}</span>
                  <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Formatos JPG, PNG (Máx 5MB)</p>
                </>
              )}
              <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={manejarArchivo} style={{ display: 'none' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="input-group">
              <span className="label-premium" style={{ display: 'block', marginBottom: '8px', fontWeight: '800', color: '#1e293b', fontSize: '0.9rem' }}>Título de la Incidencia *</span>
              <input name="titulo" value={formulario.titulo} onChange={manejarCambio} required style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc' }} placeholder="Resumen del problema" />
            </div>
            <div className="input-group">
              <span className="label-premium" style={{ display: 'block', marginBottom: '8px', fontWeight: '800', color: '#1e293b', fontSize: '0.9rem' }}>Prioridad Estimada *</span>
              <select name="prioridad" value={formulario.prioridad} onChange={manejarCambio} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <option value="baja">Baja (Mantenimiento)</option>
                <option value="media">Media (Intervención)</option>
                <option value="alta">Alta (Riesgo)</option>
                <option value="critica">Crítica (Emergencia)</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <span className="label-premium" style={{ display: 'block', marginBottom: '12px', fontWeight: '800', color: '#1e293b', fontSize: '0.9rem' }}>Categoría del Reporte *</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
              {problematicas.length === 0 ? <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Cargando categorías...</p> : null}
              {problematicas.map(prob => (
                <button 
                  key={prob.id} 
                  type="button" 
                  onClick={() => setFormulario(p => ({...p, problematica_id: prob.id}))}
                  style={{ 
                    padding: '12px', borderRadius: '14px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
                    background: formulario.problematica_id === prob.id ? '#2563eb' : '#fff',
                    color: formulario.problematica_id === prob.id ? '#fff' : '#64748b',
                    border: formulario.problematica_id === prob.id ? '1px solid #2563eb' : '1px solid #e2e8f0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                  title={prob.descripcion}
                >
                  <span style={{ fontSize: '1.2rem' }}>{prob.icono || "📋"}</span>
                  {prob.nombre}
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <span className="label-premium" style={{ display: 'block', marginBottom: '8px', fontWeight: '800', color: '#1e293b', fontSize: '0.9rem' }}>Descripción del Problema *</span>
            <textarea name="descripcion" value={formulario.descripcion} onChange={manejarCambio} required rows={3} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', resize: 'none' }} placeholder="Detalla lo que está sucediendo..." />
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
              <div>
                <span className="label-premium" style={{ fontWeight: '800', color: '#1e293b', fontSize: '0.9rem' }}>Ubicación Geográfica *</span>
                {ubicacionFijada && <span style={{ marginLeft: '12px', color: '#10b981', fontWeight: '700', fontSize: '0.85rem' }}>✅ Ubicación fijada</span>}
              </div>
              <button 
                type="button" 
                disabled={calibrandoGps} 
                onClick={() => {
                  if (!navigator.geolocation) {
                    setError("Tu navegador no soporta geolocalización.");
                    return;
                  }
                  
                  setCalibrandoGps(true);
                  setError("");
                  
                  const onSuccess = (pos) => {
                    setMapPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setUbicacionFijada(true);
                    setCalibrandoGps(false);
                    setError("");
                  };
                  
                  const fallbackToManual = () => {
                    setError("Tu sistema Windows no nos devolvió coordenadas. Por favor, marca tu ubicación exacta tocando el mapa.");
                    setCalibrandoGps(false);
                  };

                  const onError = (err) => {
                    console.warn("GPS Error Principal:", err);
                    if (err.code === 1) {
                      setError("Permiso de GPS denegado. Por favor, marca tu ubicación en el mapa manualmente.");
                      setCalibrandoGps(false);
                      return;
                    }
                    
                    // Reintento relajado (esencial para Laptops que carecen de GPS físico y usan triangulación Wi-Fi)
                    navigator.geolocation.getCurrentPosition(onSuccess, (err2) => {
                      console.warn("GPS Error Secundario:", err2);
                      fallbackToManual();
                    }, { enableHighAccuracy: false, timeout: 15000, maximumAge: Infinity });
                  };
                  
                  // Invocación estándar de geolocalización de alta precisión
                  navigator.geolocation.getCurrentPosition(onSuccess, onError, {
                    enableHighAccuracy: true,
                    timeout: 20000,
                    maximumAge: Infinity // Permite usar la última lectura conocida (Evita el timeout en Desktop)
                  });
                }} 
                style={{ 
                  color: '#2563eb', fontWeight: '800', background: '#eff6ff', border: 'none', 
                  padding: '8px 16px', borderRadius: '10px', cursor: 'pointer' 
                }}
              >
                {calibrandoGps ? "Calibrando..." : "📍 Usar Mi GPS"}
              </button>
            </div>
            <div style={{ height: "300px", borderRadius: "24px", overflow: "hidden", border: "2px solid #f1f5f9", position: 'relative' }}>
              {!mapPosition && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <div style={{ background: '#fff', padding: '12px 24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontWeight: '700', color: '#64748b' }}>
                    Toca el mapa para marcar el lugar
                  </div>
                </div>
              )}
              <MapContainer center={[12.1140, -86.2362]} zoom={13} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationMarker position={mapPosition} setPosition={setMapPosition} onFix={() => setUbicacionFijada(true)} />
              </MapContainer>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="input-group">
              <span className="label-premium" style={{ display: 'block', marginBottom: '8px', fontWeight: '800', color: '#1e293b', fontSize: '0.9rem' }}>Departamento *</span>
              <select name="departamento" value={formulario.departamento} onChange={manejarCambio} required style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <option value="">Seleccionar...</option>
                {departamentos.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="input-group">
              <span className="label-premium" style={{ display: 'block', marginBottom: '8px', fontWeight: '800', color: '#1e293b', fontSize: '0.9rem' }}>Municipio *</span>
              <select name="municipio" value={formulario.municipio} onChange={manejarCambio} required disabled={!formulario.departamento} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <option value="">Seleccionar...</option>
                {municipios.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="input-group">
            <span className="label-premium" style={{ display: 'block', marginBottom: '8px', fontWeight: '800', color: '#1e293b', fontSize: '0.9rem' }}>Dirección de Referencia *</span>
            <input name="direccion" value={formulario.direccion} onChange={manejarCambio} required style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc' }} placeholder="Ej. Frente a Pulpería El Sol" />
          </div>

          {error && <div style={{ background: '#fef2f2', color: '#ef4444', padding: '16px', borderRadius: '12px', border: '1px solid #fee2e2', fontWeight: '700', textAlign: 'center' }}>{error}</div>}
          
          <button className="primary-btn" type="submit" disabled={guardando || subiendoImagen} style={{ 
            height: '64px', fontSize: '1.2rem', fontWeight: '800', borderRadius: '20px', 
            background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', color: '#fff', border: 'none', cursor: 'pointer',
            boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)', marginTop: '1rem'
          }}>
            {guardando ? "Procesando Reporte..." : "🚀 Enviar Denuncia Ahora"}
          </button>
        </form>
      </div>
    </div>
  );
}
