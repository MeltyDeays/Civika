import { useCallback, useEffect, useMemo, useState } from "react";
import { tareasTecnicoModel } from "../Modelos/tareasModel";
import { useAuth } from "../../../modules/auth/controllers/useAuth.jsx";
import { parsearPuntoGeo } from "../../../utils/formatters";

const COLUMNAS = [
  { id: 0, key: "pendiente", title: "Pendiente" },
  { id: 1, key: "en_reparacion", title: "En Reparación" },
  { id: 2, key: "completado", title: "Completado" },
  { id: 3, key: "rechazado", title: "Rechazado" },
];

/**
 * ViewModel del Técnico — H026
 * Custom Hook que gestiona tareas asignadas y cambio de estados.
 */
export function useTareasTecnico() {
  const { perfil } = useAuth();
  const [tareas, setTareas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    if (!perfil?.id) return;
    setCargando(true);
    setError("");
    try {
      const res = await tareasTecnicoModel.listarAsignadas(perfil.id);
      if (res.error) throw new Error(res.error.message);
      setTareas((res.data || []).map(t => {
        const geo = parsearPuntoGeo(t.ubicacion);
        return { ...t, lat: geo?.lat, lng: geo?.lng };
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [perfil?.id]);

  useEffect(() => { cargar(); }, [cargar]);

  const agrupado = useMemo(() => {
    return COLUMNAS.map((col) => ({
      ...col,
      items: tareas.filter((t) => t.estado === col.key),
    }));
  }, [tareas]);

  const historial = useMemo(() => {
    return tareas
      .filter((t) => t.estado === "completado" || t.estado === "rechazado")
      .sort((a, b) => new Date(b.actualizado_el || b.creado_el) - new Date(a.actualizado_el || a.creado_el));
  }, [tareas]);

  const statsHistorial = useMemo(() => {
    const completadas = historial.filter(t => t.estado === "completado").length;
    const rechazadas = historial.filter(t => t.estado === "rechazado").length;
    const total = historial.length;
    const ratio = total > 0 ? Math.round((completadas / total) * 100) : 0;
    return { completadas, rechazadas, total, ratio };
  }, [historial]);

  const cambiarEstado = useCallback(async (denunciaId, nuevoEstado, comentario = "") => {
    await tareasTecnicoModel.cambiarEstado(denunciaId, nuevoEstado, comentario);
    setTareas((prev) =>
      prev.map((t) => t.id === denunciaId ? { ...t, estado: nuevoEstado, comentario_cierre: comentario } : t)
    );
  }, []);

  return { tareas, agrupado, historial, statsHistorial, cargando, error, cargar, cambiarEstado, COLUMNAS };
}
