import { useCallback, useEffect, useState } from "react";
import { denunciasCiudadanoModel } from "../Modelos/denunciasModel";

export function useDenunciasCiudadano() {
  const [reportes, setReportes] = useState([]);
  const [meta, setMeta] = useState({ source: "supabase", error: null });

  const cargarReportes = useCallback(async () => {
    const result = await denunciasCiudadanoModel.listar();
    setReportes(result.data || []);
    setMeta({ source: result.source, error: result.error });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarReportes();
    }, 0);
    return () => clearTimeout(timer);
  }, [cargarReportes]);

  const crear = useCallback(async (payload) => {
    const nuevo = await denunciasCiudadanoModel.crear(payload);
    setReportes((prev) => [nuevo, ...prev]);
    return nuevo;
  }, []);

  const actualizar = useCallback(async (idReporte, payload) => {
    const actualizado = await denunciasCiudadanoModel.actualizar(idReporte, payload);
    setReportes((prev) => prev.map((item) => (item.id === actualizado.id ? actualizado : item)));
    return actualizado;
  }, []);

  const eliminar = useCallback(async (idReporte) => {
    await denunciasCiudadanoModel.eliminar(idReporte);
    setReportes((prev) => prev.filter((item) => item.id !== idReporte));
  }, []);

  const actualizarFirmaLocal = useCallback((idReporte, nuevaCantidad) => {
    setReportes((prev) => prev.map((item) => item.id === idReporte ? { ...item, firmas: nuevaCantidad } : item));
  }, []);

  return { reportes, meta, cargarReportes, crear, actualizar, eliminar, actualizarFirmaLocal };
}

