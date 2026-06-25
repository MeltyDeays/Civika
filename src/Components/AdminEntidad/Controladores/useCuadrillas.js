import { useCallback, useEffect, useState } from "react";
import { cuadrillasModel } from "../Modelos/cuadrillasModel";
import { useAuth } from "../../../modules/auth/controllers/useAuth.jsx";

export function useCuadrillas() {
  const { perfil, cargandoSesion } = useAuth();
  const [tecnicos, setTecnicos] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [invitaciones, setInvitaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargarDatos = useCallback(async () => {
    if (cargandoSesion) return; // Esperar a que la sesión cargue
    
    if (!perfil?.id_entidad) {
      setError("Tu cuenta no tiene una entidad asignada. No puedes gestionar personal.");
      setCargando(false);
      return;
    }

    setCargando(true);
    setError("");
    try {
      // Cargamos ambas promesas en paralelo
      const [resTecnicos, resCuadrillas, resInvitaciones] = await Promise.all([
        cuadrillasModel.listarTecnicosEntidad(perfil.id_entidad),
        cuadrillasModel.listarCuadrillas(perfil.id_entidad),
        cuadrillasModel.listarInvitaciones(perfil.id_entidad)
      ]);
      setTecnicos(resTecnicos);
      setCuadrillas(resCuadrillas);
      setInvitaciones(resInvitaciones);
    } catch (e) {
      setError(e.message || "Error al cargar cuadrillas.");
    } finally {
      setCargando(false);
    }
  }, [perfil?.id_entidad, cargandoSesion]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const crearCuadrilla = async (payload) => {
    if (!perfil?.id_entidad) throw new Error("Sin entidad asignada.");
    await cuadrillasModel.crearCuadrilla({ ...payload, id_entidad: perfil.id_entidad });
    await cargarDatos();
  };

  const alternarEstado = async (id, activa) => {
    await cuadrillasModel.toggleActiva(id, activa);
    await cargarDatos();
  };

  const eliminarCuadrilla = async (id) => {
    await cuadrillasModel.eliminarCuadrilla(id);
    await cargarDatos();
  };

  const generarInvitacion = async (especialidad) => {
    if (!perfil?.id_entidad) throw new Error("Sin entidad asignada.");
    const nuevaInv = await cuadrillasModel.generarInvitacion(perfil.id_entidad, especialidad);
    setInvitaciones([nuevaInv, ...invitaciones]);
    return nuevaInv;
  };

  const eliminarInvitacion = async (id) => {
    await cuadrillasModel.eliminarInvitacion(id);
    setInvitaciones(invitaciones.filter(inv => inv.id !== id));
  };

  const editarInvitacion = async (id, especialidad) => {
    const actualizada = await cuadrillasModel.editarInvitacion(id, especialidad);
    setInvitaciones(invitaciones.map(inv => inv.id === id ? actualizada : inv));
    return actualizada;
  };

  // H023: Editar datos de un técnico
  const editarTecnico = async (tecnicoId, campos) => {
    await cuadrillasModel.editarTecnico(tecnicoId, campos);
    await cargarDatos();
  };

  // H023: Desactivar técnico (valida tareas pendientes)
  const desactivarTecnico = async (tecnicoId) => {
    await cuadrillasModel.desactivarTecnico(tecnicoId);
    await cargarDatos();
  };

  // H023: Reactivar técnico
  const reactivarTecnico = async (tecnicoId) => {
    await cuadrillasModel.reactivarTecnico(tecnicoId);
    await cargarDatos();
  };

  return { 
    tecnicos, cuadrillas, invitaciones, cargando, error, 
    recargar: cargarDatos, crearCuadrilla, alternarEstado, 
    eliminarCuadrilla, generarInvitacion, eliminarInvitacion, editarInvitacion,
    editarTecnico, desactivarTecnico, reactivarTecnico
  };
}
