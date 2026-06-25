import { supabase } from "../../../core/supabaseClient";

export const entidadesSuperAdminModel = {
  async listar() {
    return await supabase
      .from("entidades_admin")
      .select(`
        id,nombre,sector,categoria,codigo_invitacion,esta_usado,
        entidad_problematica(problematica_id)
      `)
      .order("nombre");
  },

  async listarProblematicas() {
    return await supabase.from("problematicas").select("*").order("creado_el");
  },

  async crearProblematica(datos) {
    return await supabase.from("problematicas").insert([datos]).select().single();
  },

  async actualizarProblematica(id, datos) {
    return await supabase.from("problematicas").update(datos).eq("id", id).select().single();
  },

  async eliminarProblematica(id) {
    return await supabase.from("problematicas").delete().eq("id", id);
  },

  async crearEntidadConProblematicas(datosEntidad, problematicasIds) {
    const codigo_invitacion = `ENT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const { data: nuevaEntidad, error: errorEntidad } = await supabase
      .from("entidades_admin")
      .insert([{
        nombre: datosEntidad.nombre,
        sector: datosEntidad.sector,
        codigo_invitacion,
        esta_usado: false
      }])
      .select("id")
      .single();

    if (errorEntidad) throw errorEntidad;

    if (problematicasIds && problematicasIds.length > 0) {
      const vinculaciones = problematicasIds.map(prob_id => ({
        entidad_id: nuevaEntidad.id,
        problematica_id: prob_id
      }));

      const { error: errorVinculos } = await supabase
        .from("entidad_problematica")
        .insert(vinculaciones);

      if (errorVinculos) throw errorVinculos;
    }

    return { entidad_id: nuevaEntidad.id, codigo: codigo_invitacion };
  },

  async eliminarEntidad(id) {
    return await supabase.from("entidades_admin").delete().eq("id", id);
  },

  async actualizarEntidad(id, datos) {
    return await supabase.from("entidades_admin").update(datos).eq("id", id).select().single();
  }
};

