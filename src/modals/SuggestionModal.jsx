import { useState, useEffect } from "react";
import { DEPARTAMENTOS_NICARAGUA } from "../utils/constants";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

function LocationMarker({ position, setPosition }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 16, { duration: 1.5 });
  }, [position, map]);
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return position === null ? null : <Marker position={position}></Marker>;
}

const FORMULARIO_INICIAL = {
  titulo: "",
  descripcion: "",
  departamento: "",
  municipio: "",
  direccion: "",
  prioridad: "media",
  tipo: "sugerencia",
  lat: "",
  lng: ""
};

export default function ModalSugerencia({ estaAbierto, alCerrar, alEnviar }) {
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [mapPosition, setMapPosition] = useState(null);
  const [calibrandoGps, setCalibrandoGps] = useState(false);

  useEffect(() => {
    if (estaAbierto) {
      setFormulario(FORMULARIO_INICIAL);
      setMapPosition(null);
      setError("");
    }
  }, [estaAbierto]);

  useEffect(() => {
    if (mapPosition) {
      setFormulario(prev => {
        if (prev.lat === mapPosition.lat && prev.lng === mapPosition.lng) return prev;
        return { ...prev, lat: mapPosition.lat, lng: mapPosition.lng };
      });
    }
  }, [mapPosition]);

  if (!estaAbierto) return null;

  const manejarCambio = (event) => {
    const { name, value } = event.target;
    setFormulario((prev) => {
      const nuevo = { ...prev, [name]: value };
      if (name === "departamento") nuevo.municipio = "";
      return nuevo;
    });
  };

  const manejarEnvio = async (event) => {
    event.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await alEnviar(formulario);
      setFormulario(FORMULARIO_INICIAL);
      setMapPosition(null);
      alCerrar();
    } catch (errorEnvio) {
      setError(errorEnvio.message);
    } finally {
      setEnviando(false);
    }
  };

  const departamentos = Object.keys(DEPARTAMENTOS_NICARAGUA);
  const municipios = formulario.departamento ? DEPARTAMENTOS_NICARAGUA[formulario.departamento].municipios : [];

  return (
    <div className="modal-backdrop" onClick={alCerrar} style={{ backdropFilter: 'blur(8px)', padding: '1rem' }}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()} style={{ width: 'min(800px, 100%)', padding: '0', overflow: 'hidden', borderRadius: '32px', maxHeight: '95vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header Premium */}
        <div style={{ background: 'linear-gradient(135deg, #1f64ff 0%, #1248c7 100%)', padding: '2rem', color: '#fff', textAlign: 'center', position: 'relative' }}>
          <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800' }}>Nueva Propuesta Ciudadana</h3>
          <p style={{ margin: '8px 0 0', opacity: 0.8 }}>Tu idea puede transformar el futuro de tu comunidad</p>
          <button onClick={alCerrar} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={manejarEnvio} style={{ padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="input-group">
            <span className="label-premium">Tipo de Propuesta</span>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="button" className={formulario.tipo === 'sugerencia' ? 'primary-btn' : 'ghost-btn'} onClick={() => setFormulario(p => ({...p, tipo: 'sugerencia'}))} style={{ flex: 1, height: '48px', borderRadius: '16px' }}>💡 Sugerencia</button>
              <button type="button" className={formulario.tipo === 'reforma' ? 'primary-btn' : 'ghost-btn'} onClick={() => setFormulario(p => ({...p, tipo: 'reforma'}))} style={{ flex: 1, height: '48px', borderRadius: '16px' }}>📄 Reforma</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="input-group">
              <span className="label-premium">Título de la propuesta *</span>
              <input name="titulo" value={formulario.titulo} onChange={manejarCambio} placeholder="Ej. Ciclovía en zona central" required />
            </div>
            <div className="input-group">
              <span className="label-premium">Importancia / Urgencia *</span>
              <select name="prioridad" className="minimal-select" value={formulario.prioridad} onChange={manejarCambio}>
                <option value="baja">Baja</option>
                <option value="media">Media</option>
                <option value="alta">Alta</option>
                <option value="critica">Urgente / Crítica</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <span className="label-premium">Descripción detallada *</span>
            <textarea name="descripcion" value={formulario.descripcion} onChange={manejarCambio} rows={4} placeholder="Explica tu idea y cómo beneficia a la ciudad..." required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="input-group">
              <span className="label-premium">Departamento *</span>
              <select name="departamento" className="minimal-select" value={formulario.departamento} onChange={manejarCambio} required>
                <option value="">Seleccionar...</option>
                {departamentos.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="input-group">
              <span className="label-premium">Municipio *</span>
              <select name="municipio" className="minimal-select" value={formulario.municipio} onChange={manejarCambio} required disabled={!formulario.departamento}>
                <option value="">Seleccionar...</option>
                {municipios.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="input-group">
            <span className="label-premium">Dirección o Referencia Exacta *</span>
            <input name="direccion" value={formulario.direccion} onChange={manejarCambio} required placeholder="Ej. De la rotonda 1c arriba" />
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
              <span className="label-premium">Ubicación en el Mapa</span>
              <button type="button" className="ghost-btn" disabled={calibrandoGps} onClick={() => {
                if (!navigator.geolocation) {
                  setError("Tu navegador no soporta geolocalización.");
                  return;
                }
                setCalibrandoGps(true);
                setError("");
                
                const onSuccess = (pos) => {
                  setMapPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
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
                    setError("Permiso denegado. Marca el lugar en el mapa.");
                    setCalibrandoGps(false);
                    return;
                  }
                  
                  // Reintento relajado (esencial para Laptops que carecen de GPS físico y usan triangulación Wi-Fi)
                  navigator.geolocation.getCurrentPosition(onSuccess, (err2) => {
                    console.warn("GPS Error Secundario:", err2);
                    fallbackToManual();
                  }, { enableHighAccuracy: false, timeout: 15000, maximumAge: Infinity });
                };

                navigator.geolocation.getCurrentPosition(onSuccess, onError, {
                  enableHighAccuracy: true,
                  timeout: 20000,
                  maximumAge: Infinity
                });
              }} style={{ color: '#1f64ff', fontWeight: 'bold', height: '32px' }}>
                {calibrandoGps ? "Localizando..." : "📍 Usar ubicación"}
              </button>
            </div>
            <div style={{ height: "250px", borderRadius: "24px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
              <MapContainer center={[12.1140, -86.2362]} zoom={13} style={{ height: "100%", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationMarker position={mapPosition} setPosition={setMapPosition} />
              </MapContainer>
            </div>
          </div>

          {error ? <p className="error-text" style={{ textAlign: 'center' }}>{error}</p> : null}
          
          <button className="primary-btn" type="submit" disabled={enviando} style={{ height: '60px', fontSize: '1.2rem', fontWeight: 'bold', borderRadius: '18px' }}>
            {enviando ? "Publicando..." : "🚀 Publicar Propuesta"}
          </button>
        </form>
      </div>
    </div>
  );
}
