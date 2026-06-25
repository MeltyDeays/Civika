import { MapContainer, TileLayer, useMap, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { useMapaCalor } from "../Controladores/useMapaCalor";
import { DEPARTAMENTOS_NICARAGUA } from "../../../utils/constants";

// ─── Utilidades de presentación (solo UI) ───────────────────────────

const createPulsingIcon = (color) => {
  return L.divIcon({
    className: 'pulsing-marker-container',
    html: `<div class="pulsing-marker" style="background-color: ${color}; box-shadow: 0 0 0 0 ${color}66;"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

function getUrgencyColor(urgency) {
  if (urgency === 'critica') return '#ef4444';
  if (urgency === 'alta') return '#f97316';
  if (urgency === 'media') return '#facc15';
  return '#22c55e';
}

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

// ─── Vista (componente "tonto" — solo renderiza) ────────────────────

export default function MapaCalorView() {
  const vm = useMapaCalor();

  return (
    <section className="heatmap-view-premium" style={{ padding: '32px' }}>
      <header className="view-header-minimal" style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em' }}>Mapa de Calor</h1>
        <p style={{ color: '#64748b', fontSize: '15px', fontWeight: '500' }}>Visualiza la distribución de problemas reportados en el territorio.</p>
      </header>

      {/* ─── Barra de Filtros ─── */}
      <div className="toolbar-premium" style={{ 
        position: 'relative', zIndex: 10, marginBottom: '24px'
      }}>
        <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', marginRight: '4px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
        </div>

        <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
          {["Infraestructura", "Sugerencias"].map((t) => (
            <button key={t} onClick={() => vm.setActiveType(t)} style={{
              padding: '8px 20px', borderRadius: '8px', border: 'none', fontSize: '14px',
              fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s',
              background: vm.activeType === t ? 'var(--primary)' : 'transparent',
              color: vm.activeType === t ? '#fff' : '#64748b'
            }}>{t}</button>
          ))}
        </div>

        <select id="dept-filter" name="department" value={vm.selectedDept}
          onChange={(e) => vm.setDepartamento(e.target.value)} className="minimal-select">
          <option>Todos los departamentos</option>
          {Object.keys(DEPARTAMENTOS_NICARAGUA).map(dept => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        {vm.selectedDept !== "Todos los departamentos" && (
          <select id="city-filter" name="city" value={vm.selectedCity}
            onChange={(e) => vm.setSelectedCity(e.target.value)} className="minimal-select">
            <option>Todas las ciudades</option>
            {vm.availableCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        )}

        {/* Selector de Urgencia con Colores */}
        <div className="custom-urgency-dropdown" style={{ position: 'relative', zIndex: 20 }} onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => vm.setShowUrgencyMenu(!vm.showUrgencyMenu)}
            className="field minimal-select" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textAlign: 'left', width: 'auto', minWidth: '170px', minHeight: '42px', padding: '0 2.5rem 0 1rem' }}>
            {vm.currentUrgencyObj.color !== 'transparent' && (
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: vm.currentUrgencyObj.color, display: 'inline-block', boxShadow: `0 0 8px ${vm.currentUrgencyObj.color}66` }}></span>
            )}
            {vm.currentUrgencyObj.label}
          </button>

          {vm.showUrgencyMenu && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: '100%', minWidth: '180px',
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '8px', zIndex: 30
            }}>
              {vm.URGENCY_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => { vm.setSelectedUrgency(opt.value); vm.setShowUrgencyMenu(false); }}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px', border: 'none',
                    background: vm.selectedUrgency === opt.value ? 'var(--primary-light)' : 'transparent',
                    display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                    fontSize: '14px', fontWeight: '600',
                    color: vm.selectedUrgency === opt.value ? 'var(--primary)' : '#475569',
                    textAlign: 'left', transition: 'all 0.2s'
                  }}>
                  <span style={{ 
                    width: '12px', height: '12px', borderRadius: '50%', 
                    background: opt.color === 'transparent' ? '#cbd5e1' : opt.color,
                    boxShadow: opt.color !== 'transparent' ? `0 0 8px ${opt.color}66` : 'none'
                  }}></span>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#94a3b8', fontWeight: '600', paddingRight: '8px' }}>
          {vm.validReportes.length} puntos visibles
        </span>
      </div>
      
      {/* ─── Mapa ─── */}
      <div className="map-view-container" style={{ 
        height: 'min(60vh, 600px)', width: '100%', borderRadius: '24px', overflow: 'hidden', 
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid #e2e8f0', position: 'relative', zIndex: 1
      }}>
        <MapContainer center={vm.NICARAGUA_CENTER} zoom={7} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <MapController center={vm.mapConfig.center} zoom={vm.mapConfig.zoom} />
          
          {vm.validReportes.map((item) => (
            <Marker key={item.id} position={[item.lat, item.lng]} icon={createPulsingIcon(getUrgencyColor(item.urgency))}>
              <Popup>
                <div style={{ padding: '4px', minWidth: '180px' }}>
                  <strong style={{ display: 'block', marginBottom: '6px', fontSize: '14px' }}>{item.titulo}</strong>
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    📍 {item.municipio}, {item.departamento}
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{item.categoria}</span>
                  <div style={{ 
                    marginTop: '8px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', 
                    padding: '4px 10px', borderRadius: '6px', display: 'inline-block',
                    background: item.urgency === 'critica' ? '#fef2f2' : item.urgency === 'alta' ? '#fff7ed' : '#f0fdf4',
                    color: item.urgency === 'critica' ? '#dc2626' : item.urgency === 'alta' ? '#ea580c' : '#16a34a'
                  }}>
                    {item.urgency || 'Media'}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Leyenda flotante */}
        <div style={{
          position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255, 255, 255, 0.95)', padding: '8px 20px', borderRadius: '20px',
          display: 'flex', gap: '20px', fontSize: '12px', fontWeight: '600', zIndex: 5,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)', backdropFilter: 'blur(8px)'
        }}>
          {[{c:'#ef4444',l:'Crítica'},{c:'#f97316',l:'Alta'},{c:'#facc15',l:'Media'},{c:'#22c55e',l:'Baja'}].map(i => (
            <div key={i.l} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: i.c }}></span> {i.l}
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .pulsing-marker-container { display: flex; align-items: center; justify-content: center; }
        .pulsing-marker {
          width: 14px; height: 14px; border-radius: 50%; cursor: pointer;
          animation: pulse 2s infinite; border: 2.5px solid #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        @keyframes pulse {
          0% { transform: scale(0.9); box-shadow: 0 0 0 0 currentColor; }
          70% { transform: scale(1.1); box-shadow: 0 0 0 12px rgba(0, 0, 0, 0); }
          100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(0, 0, 0, 0); }
        }
      `}} />
    </section>
  );
}
