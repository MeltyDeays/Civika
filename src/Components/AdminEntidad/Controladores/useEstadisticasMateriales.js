import { useCallback, useEffect, useState } from "react";
import { estadisticasAdminEntidadModel } from "../Modelos/estadisticasModel";
import { inventarioAdminEntidadModel } from "../Modelos/inventarioModel";

export function useEstadisticasMateriales(entidadId) {
  const [cpgData, setCpgData] = useState([]);
  const [idlData, setIdlData] = useState([]);
  const [empData, setEmpData] = useState([]);
  const [edaData, setEdaData] = useState([]);
  const [inventarioData, setInventarioData] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const recargar = useCallback(async () => {
    if (!entidadId) return;
    setCargando(true);
    setError("");
    try {
      const [resCPG, resIDL, resEMP, resEDA, resInv] = await Promise.all([
        estadisticasAdminEntidadModel.obtenerCPG(entidadId),
        estadisticasAdminEntidadModel.obtenerIDL(entidadId),
        estadisticasAdminEntidadModel.obtenerEMP(entidadId),
        estadisticasAdminEntidadModel.obtenerEDA(entidadId),
        inventarioAdminEntidadModel.listarInventario(entidadId),
      ]);

      if (resCPG.error) throw new Error(resCPG.error.message);
      if (resIDL.error) throw new Error(resIDL.error.message);
      if (resEMP.error) throw new Error(resEMP.error.message);
      if (resEDA.error) throw new Error(resEDA.error.message);
      if (resInv.error) throw new Error(resInv.error.message);

      setCpgData(resCPG.data || []);
      setIdlData(resIDL.data || []);
      setEmpData(resEMP.data || []);
      setEdaData(resEDA.data || []);
      setInventarioData(resInv.data || []);
    } catch (e) {
      setError(e.message || "No se pudieron cargar estadísticas");
    } finally {
      setCargando(false);
    }
  }, [entidadId]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { 
    cpgData, 
    idlData, 
    empData, 
    edaData, 
    inventarioData,
    cargando, 
    error, 
    recargar 
  };
}

