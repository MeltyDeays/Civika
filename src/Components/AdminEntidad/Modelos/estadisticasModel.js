import { supabase } from "../../../core/supabaseClient";

export const estadisticasAdminEntidadModel = {
  async listarUsoMateriales(entidadId) {
    return await supabase
      .from("uso_materiales_reparacion")
      .select(
        "material_id,cantidad_usada,prioridad_denuncia,categoria_denuncia,fecha_aplicacion,materiales(id,nombre,unidad_medida)"
      )
      .eq("entidad_id", entidadId)
      .order("fecha_aplicacion", { ascending: false });
  },

  async obtenerCPG(entidadId) {
    return await supabase
      .from("v_consumo_promedio_prioridad")
      .select("*")
      .eq("entidad_id", entidadId);
  },

  async obtenerIDL(entidadId) {
    return await supabase
      .from("v_desgaste_logistico")
      .select("*")
      .eq("entidad_id", entidadId);
  },

  async obtenerEMP(entidadId) {
    return await supabase
      .from("v_estimacion_material_pendiente")
      .select("*")
      .eq("entidad_id", entidadId);
  },

  async obtenerEDA(entidadId) {
    return await supabase
      .from("v_correlacion_retraso_consumo")
      .select("*")
      .eq("entidad_id", entidadId);
  }
};

