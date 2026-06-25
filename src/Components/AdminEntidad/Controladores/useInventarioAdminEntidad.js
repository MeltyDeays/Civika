import { useCallback, useEffect, useState } from "react";
import { inventarioAdminEntidadModel } from "../Modelos/inventarioModel";

export function useInventarioAdminEntidad(entidadId) {
  const [inventario, setInventario] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const recargar = useCallback(async () => {
    if (!entidadId) return;
    setCargando(true);
    setError("");
    try {
      const [invRes, matRes] = await Promise.all([
        inventarioAdminEntidadModel.listarInventario(entidadId),
        inventarioAdminEntidadModel.listarMateriales(),
      ]);

      if (invRes.error) throw new Error(invRes.error.message);
      if (matRes.error) throw new Error(matRes.error.message);

      setInventario(invRes.data || []);
      setMateriales(matRes.data || []);
    } catch (e) {
      setError(e.message || "No se pudo cargar el inventario");
    } finally {
      setCargando(false);
    }
  }, [entidadId]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const crearMaterial = useCallback(async ({ nombre, unidad_medida, categoria }) => {
    const res = await inventarioAdminEntidadModel.crearMaterial({ nombre, unidad_medida, categoria });
    if (res.error) throw new Error(res.error.message);
    setMateriales((prev) => [res.data, ...prev].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    return res.data;
  }, []);

  const upsertItem = useCallback(
    async ({ materialId, cantidad, stock_minimo }) => {
      if (!entidadId) throw new Error("Entidad no disponible");
      const res = await inventarioAdminEntidadModel.upsertInventario({
        entidadId,
        materialId,
        cantidad,
        stock_minimo,
      });
      if (res.error) throw new Error(res.error.message);
      await recargar();
      return res.data;
    },
    [entidadId, recargar]
  );

  return { inventario, materiales, cargando, error, recargar, crearMaterial, upsertItem };
}

