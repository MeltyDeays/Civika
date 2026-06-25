import { crearSugerencia, obtenerSugerencias, actualizarSugerencia, eliminarSugerencia } from "../../../services/suggestionService";

export const sugerenciasCiudadanoModel = {
  listar: obtenerSugerencias,
  crear: crearSugerencia,
  actualizar: actualizarSugerencia,
  eliminar: eliminarSugerencia,
};

