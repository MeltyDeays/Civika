import {
  actualizarReporte,
  crearReporte,
  eliminarReporte,
  obtenerReportes,
} from "../../../services/reportService";

export const denunciasCiudadanoModel = {
  listar: obtenerReportes,
  crear: crearReporte,
  actualizar: actualizarReporte,
  eliminar: eliminarReporte,
};

