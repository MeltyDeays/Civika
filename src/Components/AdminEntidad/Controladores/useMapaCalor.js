import { useEffect, useMemo, useState, useCallback } from "react";
import { obtenerSugerencias } from "../../../services/suggestionService";
import { DEPARTAMENTOS_NICARAGUA } from "../../../utils/constants";
import { MUNICIPIO_COORDS } from "../../../utils/municipioCoords";
import { useAuth } from "../../../modules/auth/controllers/useAuth.jsx";
import { parsearPuntoGeo } from "../../../utils/formatters";
import { adminEntidadReportesModel } from "../Modelos/reportesModel";

function getCityCoords(cityName, deptName) {
  if (MUNICIPIO_COORDS[cityName]) {
    return Promise.resolve(MUNICIPIO_COORDS[cityName]);
  }
  const query = `${cityName}, ${deptName}, Nicaragua`;
  return fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`)
    .then(res => res.json())
    .then(data => {
      if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
      return null;
    })
    .catch(() => null);
}

const URGENCY_OPTIONS = [
  { value: "Toda urgencia", label: "Toda urgencia", color: "transparent" },
  { value: "critica", label: "Crítica", color: "#ef4444" },
  { value: "alta", label: "Alta", color: "#f97316" },
  { value: "media", label: "Media", color: "#facc15" },
  { value: "baja", label: "Baja", color: "#22c55e" },
];

const NICARAGUA_CENTER = [12.8654, -85.2072];
const NICARAGUA_ZOOM = 7;

export function useMapaCalor() {
  const { perfil } = useAuth();
  const [dataPoints, setDataPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeType, setActiveType] = useState("Infraestructura");
  const [selectedDept, setSelectedDept] = useState("Todos los departamentos");
  const [selectedCity, setSelectedCity] = useState("Todas las ciudades");
  const [selectedUrgency, setSelectedUrgency] = useState("Toda urgencia");
  const [showUrgencyMenu, setShowUrgencyMenu] = useState(false);
  const [mapConfig, setMapConfig] = useState({ center: NICARAGUA_CENTER, zoom: NICARAGUA_ZOOM });

  useEffect(() => {
    setLoading(true);
    
    // Usar el modelo del admin que hace mapeo inteligente de categorías
    const fetchReportes = adminEntidadReportesModel.listar(perfil?.id_entidad);
    const fetchSugerencias = obtenerSugerencias();

    Promise.all([fetchReportes, fetchSugerencias]).then(([repRes, sugRes]) => {
      let reps = repRes.data || [];
      let sugs = sugRes.data || [];

      const repsMapped = reps.map(r => {
        // Extraer coordenadas: el modelo del admin retorna datos crudos (sin normalizarReporte)
        const coords = parsearPuntoGeo(r.ubicacion);
        return { 
          ...r, 
          originType: "Infraestructura",
          urgency: r.prioridad || r.urgencia || "media",
          lat: coords?.lat,
          lng: coords?.lng
        };
      });
      
      const sugsMapped = sugs.map(s => {
        return {
          ...s,
          originType: "Sugerencias",
          categoria: "Sugerencia",
          urgency: s.prioridad || s.urgencia || "media",
          lat: s.lat || MUNICIPIO_COORDS[s.municipio]?.[0] || DEPARTAMENTOS_NICARAGUA[s.departamento]?.center?.[0],
          lng: s.lng || MUNICIPIO_COORDS[s.municipio]?.[1] || DEPARTAMENTOS_NICARAGUA[s.departamento]?.center?.[1]
        };
      });
      
      setDataPoints([...repsMapped, ...sugsMapped]);
      setLoading(false);
    });
  }, [perfil?.id_entidad]);

  const availableCities = useMemo(() => {
    if (selectedDept === "Todos los departamentos") return [];
    return DEPARTAMENTOS_NICARAGUA[selectedDept]?.municipios || [];
  }, [selectedDept]);

  const filteredReportes = useMemo(() => {
    return dataPoints.filter((r) => {
      // 1. Si está marcado explícitamente como oculto, no mostrar
      if (r.es_visible === false) return false;

      // 2. Auto-ocultar completados de más de 8 horas
      if (r.estado === 'completado' && r.actualizado_el) {
        // eslint-disable-next-line react-hooks/purity
        const ahora = Date.now();
        const OCHO_HORAS_MS = 8 * 60 * 60 * 1000;
        const tiempoTranscurrido = ahora - new Date(r.actualizado_el).getTime();
        if (tiempoTranscurrido > OCHO_HORAS_MS) return false;
      }

      if (activeType !== r.originType) return false;
      if (selectedDept !== "Todos los departamentos" && r.departamento === selectedDept) {
        if (selectedCity !== "Todas las ciudades" && r.municipio !== selectedCity) return false;
      } else if (selectedDept !== "Todos los departamentos") {
        return false;
      }
      
      const urgencyKey = r.urgency?.toLowerCase() || "media";
      if (selectedUrgency !== "Toda urgencia" && urgencyKey !== selectedUrgency.toLowerCase()) return false;
      return true;
    });
  }, [dataPoints, activeType, selectedDept, selectedCity, selectedUrgency]);

  const validReportes = useMemo(() => {
    return filteredReportes.filter(item => item.lat && item.lng && !isNaN(item.lat) && !isNaN(item.lng));
  }, [filteredReportes]);

  useEffect(() => {
    if (selectedCity !== "Todas las ciudades") {
      getCityCoords(selectedCity, selectedDept).then(coords => {
        if (coords) setMapConfig({ center: coords, zoom: 15 });
      });
      return;
    }
    if (selectedDept !== "Todos los departamentos" && DEPARTAMENTOS_NICARAGUA[selectedDept]) {
      const cabecera = DEPARTAMENTOS_NICARAGUA[selectedDept].municipios[0];
      const coords = MUNICIPIO_COORDS[cabecera];
      if (coords) {
        setMapConfig({ center: coords, zoom: DEPARTAMENTOS_NICARAGUA[selectedDept].zoom });
      } else {
        setMapConfig(DEPARTAMENTOS_NICARAGUA[selectedDept]);
      }
      return;
    }
    setMapConfig({ center: NICARAGUA_CENTER, zoom: NICARAGUA_ZOOM });
  }, [selectedDept, selectedCity]);

  const closeUrgencyMenu = useCallback(() => {
    if (showUrgencyMenu) setShowUrgencyMenu(false);
  }, [showUrgencyMenu]);

  useEffect(() => {
    document.addEventListener('click', closeUrgencyMenu);
    return () => document.removeEventListener('click', closeUrgencyMenu);
  }, [closeUrgencyMenu]);

  const currentUrgencyObj = URGENCY_OPTIONS.find(o => o.value === selectedUrgency) || URGENCY_OPTIONS[0];

  const setDepartamento = useCallback((dept) => {
    setSelectedDept(dept);
    setSelectedCity("Todas las ciudades");
  }, []);

  return {
    loading,
    validReportes,
    mapConfig,
    activeType,
    selectedDept,
    selectedCity,
    selectedUrgency,
    showUrgencyMenu,
    availableCities,
    currentUrgencyObj,
    setActiveType,
    setDepartamento,
    setSelectedCity,
    setSelectedUrgency,
    setShowUrgencyMenu,
    URGENCY_OPTIONS,
    NICARAGUA_CENTER,
  };
}
