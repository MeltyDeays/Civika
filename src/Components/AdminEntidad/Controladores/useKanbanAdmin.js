import { useCallback, useEffect, useMemo, useState } from "react";
import {
  obtenerTareasKanban,
  moverTarea,
  quitarDelTablero,
  asignarResponsable as asignarResponsableService,
  asignarCuadrilla as asignarCuadrillaService,
  obtenerTareaDetalle,
} from "../../../services/kanbanService";
import { supabase } from "../../../core/supabaseClient";
import { DEPARTAMENTOS_NICARAGUA } from "../../../utils/constants";
import { useAuth } from "../../../modules/auth/controllers/useAuth.jsx";
import { procesarInventarioDesdeTexto } from "../../../services/iaService";

const OCHO_HORAS_MS = 8 * 60 * 60 * 1000;

export function useKanbanAdmin() {
  const { perfil } = useAuth();
  const [tareas, setTareas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [idMoviendo, setIdMoviendo] = useState("");
  const [mostrarHistorial, setMostrarHistorial] = useState(false);

  const [filtroDept, setFiltroDept] = useState("Todos");
  const [filtroCity, setFiltroCity] = useState("Todos");

  const [histFiltroDept, setHistFiltroDept] = useState("Todos");
  const [histFiltroCity, setHistFiltroCity] = useState("Todos");
  const [histFiltroPrio, setHistFiltroPrio] = useState("todas");
  const [histBusqueda, setHistBusqueda] = useState("");

  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [detalleAsignacion, setDetalleAsignacion] = useState({ id_responsable: null, id_cuadrilla_asignada: null });
  const [tecnicosEntidad, setTecnicosEntidad] = useState([]);
  const [cuadrillasEntidad, setCuadrillasEntidad] = useState([]);
  const [guardandoAsignacion, setGuardandoAsignacion] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    const res = await obtenerTareasKanban();
    setTareas(res.data || []);
    setCargando(false);
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (!perfil?.id_entidad) return;
    const cargarPersonal = async () => {
      const [resTec, resCuad] = await Promise.all([
        supabase.from("perfiles").select("id, nombre_completo, especialidad, activo").eq("id_entidad", perfil.id_entidad).eq("rol", "tecnico").eq("activo", true).order("nombre_completo"),
        supabase.from("cuadrillas_base").select("id, nombre, activa, id_lider, perfiles!cuadrillas_base_id_lider_fkey(nombre_completo)").eq("id_entidad", perfil.id_entidad).eq("activa", true)
      ]);
      setTecnicosEntidad(resTec.data || []);
      setCuadrillasEntidad(resCuad.data || []);
    };
    cargarPersonal();
  }, [perfil?.id_entidad]);

  const abrirDetalleTarea = useCallback(async (tarea) => {
    setTareaSeleccionada(tarea);
    try {
      const detalle = await obtenerTareaDetalle(tarea.id);
      setDetalleAsignacion(detalle);
    } catch {
      setDetalleAsignacion({ id_responsable: null, id_cuadrilla_asignada: null });
    }
  }, []);

  const cerrarDetalleTarea = useCallback(() => {
    setTareaSeleccionada(null);
    setDetalleAsignacion({ id_responsable: null, id_cuadrilla_asignada: null });
  }, []);

  const guardarAsignacion = useCallback(async (idDenuncia, idResponsable, idCuadrilla) => {
    setGuardandoAsignacion(true);
    try {
      await asignarResponsableService(idDenuncia, idResponsable);
      await asignarCuadrillaService(idDenuncia, idCuadrilla);
      setDetalleAsignacion({ id_responsable: idResponsable, id_cuadrilla_asignada: idCuadrilla });
    } catch (e) {
      console.error("Error asignando:", e);
      throw e;
    } finally {
      setGuardandoAsignacion(false);
    }
  }, []);

  const ciudadesDisponibles = useMemo(() => {
    if (filtroDept === "Todos") return [];
    return DEPARTAMENTOS_NICARAGUA[filtroDept]?.municipios || [];
  }, [filtroDept]);

  const cambiarDepartamento = useCallback((dept) => {
    setFiltroDept(dept);
    setFiltroCity("Todos");
  }, []);

  const histCiudadesDisponibles = useMemo(() => {
    if (histFiltroDept === "Todos") return [];
    return DEPARTAMENTOS_NICARAGUA[histFiltroDept]?.municipios || [];
  }, [histFiltroDept]);

  const cambiarHistDepartamento = useCallback((dept) => {
    setHistFiltroDept(dept);
    setHistFiltroCity("Todos");
  }, []);

  const { tareasActivas, historial } = useMemo(() => {
    const ahora = Date.now();
    const activas = [];
    const hist = [];
    const termino = histBusqueda.toLowerCase();

    tareas.forEach((t) => {
      let esHistorial = false;
      if (t.indice_columna === 2 && t.fecha_fin) {
        const completadaHace = ahora - new Date(t.fecha_fin).getTime();
        if (completadaHace > OCHO_HORAS_MS) {
          esHistorial = true;
        }
      }

      if (esHistorial) {
        if (histFiltroDept !== "Todos" && t.departamento !== histFiltroDept) return;
        if (histFiltroCity !== "Todos" && t.municipio !== histFiltroCity) return;
        if (histFiltroPrio !== "todas" && t.prioridad !== histFiltroPrio) return;
        if (termino && !t.titulo.toLowerCase().includes(termino) && !(t.descripcion && t.descripcion.toLowerCase().includes(termino))) return;
        hist.push(t);
      } else {
        if (filtroDept !== "Todos" && t.departamento !== filtroDept) return;
        if (filtroCity !== "Todos" && t.municipio !== filtroCity) return;
        activas.push(t);
      }
    });

    hist.sort((a, b) => new Date(b.fecha_fin) - new Date(a.fecha_fin));
    return { tareasActivas: activas, historial: hist };
  }, [tareas, filtroDept, filtroCity, histFiltroDept, histFiltroCity, histFiltroPrio, histBusqueda]);

  const manejarMover = useCallback(async (idDenuncia, indiceColumna, comentarioCierre = "") => {
    setIdMoviendo(idDenuncia);
    try {
      await moverTarea(idDenuncia, indiceColumna, comentarioCierre);
      
      // Si la columna destino es 'Resuelto' (Índice 2) y hay notas de cierre escritas
      if (indiceColumna === 2 && comentarioCierre.trim() !== "" && perfil?.id_entidad) {
        // Ejecutar el agente de inventario para deducir y descontar materiales automáticamente
        await procesarInventarioDesdeTexto(comentarioCierre, perfil.id_entidad);
      }

      setTareas((prev) =>
        prev.map((t) =>
          t.id === idDenuncia
            ? { 
                ...t, 
                indice_columna: indiceColumna, 
                fecha_fin: indiceColumna === 2 ? new Date().toISOString() : null,
                comentario_cierre: comentarioCierre
              }
            : t
        )
      );
    } catch (e) {
      console.error("Error al mover tarea en Kanban:", e);
    } finally {
      setIdMoviendo("");
    }
  }, [perfil?.id_entidad]);

  const manejarQuitar = useCallback(async (idDenuncia) => {
    setIdMoviendo(idDenuncia);
    try {
      await quitarDelTablero(idDenuncia);
      setTareas((prev) => prev.filter((t) => t.id !== idDenuncia));
    } catch (e) {
      console.error(e);
    } finally {
      setIdMoviendo("");
    }
  }, []);

  return {
    cargando, tareasActivas, historial, idMoviendo,
    mostrarHistorial, setMostrarHistorial,
    filtroDept, filtroCity, ciudadesDisponibles, cambiarDepartamento, setFiltroCity,
    histFiltroDept, histFiltroCity, histFiltroPrio, histBusqueda,
    histCiudadesDisponibles, cambiarHistDepartamento, setHistFiltroCity, setHistFiltroPrio, setHistBusqueda,
    manejarMover, manejarQuitar, cargar,
    tareaSeleccionada, detalleAsignacion, tecnicosEntidad, cuadrillasEntidad,
    guardandoAsignacion, abrirDetalleTarea, cerrarDetalleTarea, guardarAsignacion,
  };
}
