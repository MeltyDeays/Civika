import { useCallback, useEffect, useState } from "react";
import { adminEntidadReportesModel } from "../Modelos/reportesModel";
import { useAuth } from "../../../modules/auth/controllers/useAuth.jsx";

export function useReportesAdminEntidad() {
  const { perfil } = useAuth();
  const [items, setItems] = useState([]);
  const [reportando, setReportando] = useState(false);

  const cargar = useCallback(async () => {
    const result = await adminEntidadReportesModel.listar(perfil?.id_entidad);
    setItems(result.data || []);
  }, [perfil?.id_entidad]);

  const reportarFalso = useCallback(async (denunciaId, ciudadanoId, motivo, pruebas) => {
    setReportando(true);
    try {
      const res = await adminEntidadReportesModel.reportarComoFalso(
        denunciaId,
        perfil?.id_entidad,
        ciudadanoId,
        motivo,
        pruebas
      );
      await cargar();
      return res;
    } catch (e) {
      console.error(e);
      alert("Error al reportar como falso: " + e.message);
      return { success: false, error: e.message };
    } finally {
      setReportando(false);
    }
  }, [perfil?.id_entidad, cargar]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return { items, setItems, reportando, reportarFalso, cargar };
}

