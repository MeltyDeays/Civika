import { useCallback, useEffect, useState } from "react";
import { entidadesSuperAdminModel } from "../Modelos/entidadesModel";

export function useEntidadesSuperAdmin() {
  const [entidades, setEntidades] = useState([]);
  const [problematicas, setProblematicas] = useState([]);
  const [error, setError] = useState(null);
  const [creando, setCreando] = useState(false);

  const cargarEntidades = useCallback(async () => {
    const { data, error: requestError } = await entidadesSuperAdminModel.listar();
    if (requestError) {
      setError(requestError.message);
      setEntidades([]);
      return;
    }
    setError(null);
    setEntidades(data || []);
  }, []);

  const cargarProblematicas = useCallback(async () => {
    const { data, error: requestError } = await entidadesSuperAdminModel.listarProblematicas();
    if (requestError) {
      console.error(requestError);
      return;
    }
    setProblematicas(data || []);
  }, []);

  useEffect(() => {
    cargarEntidades();
    cargarProblematicas();
  }, [cargarEntidades, cargarProblematicas]);

  const crearEntidad = async (datosEntidad, problematicasIds) => {
    setCreando(true);
    try {
      const resultado = await entidadesSuperAdminModel.crearEntidadConProblematicas(datosEntidad, problematicasIds);
      await cargarEntidades();
      return { success: true, codigo: resultado.codigo };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setCreando(false);
    }
  };

  const crearProblematica = async (datos) => {
    try {
      const { error } = await entidadesSuperAdminModel.crearProblematica(datos);
      if (error) throw error;
      await cargarProblematicas();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const eliminarProblematica = async (id) => {
    try {
      const { error } = await entidadesSuperAdminModel.eliminarProblematica(id);
      if (error) throw error;
      await cargarProblematicas();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const actualizarProblematica = async (id, datos) => {
    try {
      const { error } = await entidadesSuperAdminModel.actualizarProblematica(id, datos);
      if (error) throw error;
      await cargarProblematicas();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const eliminarEntidad = async (id) => {
    try {
      const { error } = await entidadesSuperAdminModel.eliminarEntidad(id);
      if (error) throw error;
      await cargarEntidades();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const actualizarEntidad = async (id, datos) => {
    try {
      const { error } = await entidadesSuperAdminModel.actualizarEntidad(id, datos);
      if (error) throw error;
      await cargarEntidades();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return { 
    entidades, 
    problematicas, 
    error, 
    creando, 
    cargarEntidades, 
    crearEntidad,
    eliminarEntidad,
    actualizarEntidad,
    crearProblematica,
    actualizarProblematica,
    eliminarProblematica
  };
}

