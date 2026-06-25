import { useCallback, useEffect, useState } from "react";
import { sugerenciasCiudadanoModel } from "../Modelos/sugerenciasModel";

export function useSugerenciasCiudadano() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ source: "supabase", error: null });

  const cargarSugerencias = useCallback(async () => {
    const result = await sugerenciasCiudadanoModel.listar();
    setItems(result.data || []);
    setMeta({ source: result.source, error: result.error });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarSugerencias();
    }, 0);
    return () => clearTimeout(timer);
  }, [cargarSugerencias]);

  const crear = useCallback(async (payload) => {
    const creada = await sugerenciasCiudadanoModel.crear(payload);
    setItems((prev) => [creada, ...prev]);
    return creada;
  }, []);

  const actualizar = useCallback(async (idSugerencia, payload) => {
    const actualizada = await sugerenciasCiudadanoModel.actualizar(idSugerencia, payload);
    setItems((prev) => prev.map((item) => (item.id === actualizada.id ? actualizada : item)));
    return actualizada;
  }, []);

  const eliminar = useCallback(async (idSugerencia) => {
    await sugerenciasCiudadanoModel.eliminar(idSugerencia);
    setItems((prev) => prev.filter((item) => item.id !== idSugerencia));
  }, []);

  return { items, meta, cargarSugerencias, crear, actualizar, eliminar };
}

