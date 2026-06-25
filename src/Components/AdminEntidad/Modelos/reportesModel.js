import { supabase } from "../../../core/supabaseClient";

export const adminEntidadReportesModel = {
  async listar(entidadId) {
    if (!entidadId) {
      return { data: [], error: { message: "Entidad no especificada" } };
    }

    const { data: vinculos, error: errorVinculos } = await supabase
      .from("entidad_problematica")
      .select("problematica_id")
      .eq("entidad_id", entidadId);

    if (errorVinculos) {
      return { data: [], error: errorVinculos };
    }

    const problematicasIds = vinculos.map(v => v.problematica_id);

    if (problematicasIds.length === 0) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from("denuncias")
      .select(`
        id,id_ciudadano,entidad_id,titulo,descripcion,estado,prioridad,categoria,url_imagen,direccion,departamento,municipio,ubicacion,creado_el,actualizado_el,problematica_id,es_visible,es_falso_reporte,
        problematica:problematicas(id,nombre,icono),
        firmas:firmas(count)
      `)
      .in("problematica_id", problematicasIds)
      .order("creado_el", { ascending: false });

    const normalizedData = (data || []).map(r => ({
      ...r,
      firmas: Array.isArray(r.firmas) ? r.firmas[0]?.count || 0 : Number(r.firmas) || 0
    }));

    return { data: normalizedData, error };
  },

  async reportarComoFalso(denunciaId, entidadId, ciudadanoId, motivo, pruebas) {
    const { error: errorStrike } = await supabase
      .from("strikes_ciudadano")
      .insert([{
        id_ciudadano: ciudadanoId,
        id_denuncia: denunciaId,
        id_entidad_reportante: entidadId,
        motivo: motivo,
        pruebas_entidad: pruebas || null,
        estado: 'pendiente'
      }]);

    if (errorStrike) throw errorStrike;

    const { error: errorDenuncia } = await supabase
      .from("denuncias")
      .update({
        estado: 'rechazado',
        es_falso_reporte: true,
        es_visible: false,
        motivo_falso: motivo
      })
      .eq("id", denunciaId);

    if (errorDenuncia) throw errorDenuncia;

    return { success: true };
  }
};
