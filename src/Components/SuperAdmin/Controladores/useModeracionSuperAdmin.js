import { useState, useEffect, useCallback } from "react";
import { moderacionModel } from "../Modelos/moderacionModel";
import { useAuth } from "../../../modules/auth/controllers/useAuth";

export function useModeracionSuperAdmin() {
  const { perfil: superAdmin } = useAuth();
  const [ciudadanos, setCiudadanos] = useState([]);
  const [strikesPendientes, setStrikesPendientes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const { data: ciudadanosData, error: errCiu } = await moderacionModel.listarCiudadanos();
      if (errCiu) throw errCiu;

      const { data: strikesData, error: errStr } = await moderacionModel.listarStrikesPendientes();
      if (errStr) throw errStr;

      setCiudadanos(ciudadanosData || []);
      setStrikesPendientes(strikesData || []);
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const confirmarStrike = async (strikeId, ciudadanoId, resolucion) => {
    try {
      const res = await moderacionModel.confirmarStrike(
        strikeId,
        ciudadanoId,
        superAdmin?.id,
        resolucion
      );
      await cargarDatos();
      return res;
    } catch (e) {
      alert("Error al confirmar strike: " + e.message);
      return { success: false, error: e.message };
    }
  };

  const rechazarStrike = async (strikeId, denunciaId, resolucion) => {
    try {
      const res = await moderacionModel.rechazarStrike(
        strikeId,
        denunciaId,
        superAdmin?.id,
        resolucion
      );
      await cargarDatos();
      return res;
    } catch (e) {
      alert("Error al rechazar strike: " + e.message);
      return { success: false, error: e.message };
    }
  };

  const quitarStrike = async (ciudadanoId) => {
    try {
      const res = await moderacionModel.quitarStrikeManualmente(ciudadanoId);
      await cargarDatos();
      return res;
    } catch (e) {
      alert("Error al quitar strike: " + e.message);
      return { success: false, error: e.message };
    }
  };

  const registrarPagoMulta = async (multaId, ciudadanoId) => {
    try {
      const res = await moderacionModel.registrarPagoMulta(multaId, ciudadanoId);
      await cargarDatos();
      return res;
    } catch (e) {
      alert("Error al registrar pago de multa: " + e.message);
      return { success: false, error: e.message };
    }
  };

  const condonarMulta = async (multaId, ciudadanoId) => {
    try {
      const res = await moderacionModel.condonarMulta(multaId, ciudadanoId);
      await cargarDatos();
      return res;
    } catch (e) {
      alert("Error al condonar multa: " + e.message);
      return { success: false, error: e.message };
    }
  };

  const cambiarEstadoCuenta = async (ciudadanoId, nuevoEstado) => {
    try {
      const res = await moderacionModel.cambiarEstadoCuenta(ciudadanoId, nuevoEstado);
      await cargarDatos();
      return res;
    } catch (e) {
      alert("Error al cambiar estado de cuenta: " + e.message);
      return { success: false, error: e.message };
    }
  };

  return {
    ciudadanos,
    strikesPendientes,
    cargando,
    error,
    refrescar: cargarDatos,
    confirmarStrike,
    rechazarStrike,
    quitarStrike,
    registrarPagoMulta,
    condonarMulta,
    cambiarEstadoCuenta
  };
}
