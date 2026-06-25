import { supabase } from "../../../core/supabaseClient";

export const ordenReparacionAdminEntidadModel = {
  async listarInventario(entidadId) {
    return await supabase
      .from("inventario_entidad")
      .select("entidad_id,material_id,cantidad,stock_minimo,materiales(id,nombre,unidad_medida)")
      .eq("entidad_id", entidadId);
  },

  /** H025 / V7 — Listar técnicos y cuadrillas activas */
  async listarTecnicos(entidadId) {
    return await supabase
      .from("perfiles")
      .select("id,nombre_completo,rol,especialidad")
      .eq("id_entidad", entidadId)
      .eq("rol", "tecnico")
      .order("nombre_completo");
  },

  async listarCuadrillas(entidadId) {
    return await supabase
      .from("cuadrillas_base")
      .select("id,nombre,id_lider")
      .eq("id_entidad", entidadId)
      .eq("activa", true)
      .order("nombre");
  },

  async registrarConsumo({ entidadId, denunciaId, idResponsable, idCuadrilla, items, prioridad, categoria }) {
    // items: [{ material_id, cantidad_usada }]
    
    // 0. Asignar en tareas_kanban
    if (idResponsable) {
      await supabase.from("tareas_kanban").upsert({
        id_denuncia: denunciaId,
        id_responsable: idResponsable,
        id_cuadrilla_asignada: idCuadrilla || null,
        indice_columna: 0 // Pendiente
      }, { onConflict: "id_denuncia" });
    }

    // 1. Insertar en uso_materiales_reparacion (Estadísticas y tracking general)
    const filasUso = items.map((it) => ({
      denuncia_id: denunciaId,
      entidad_id: entidadId,
      material_id: it.material_id,
      id_tecnico_registro: idResponsable || null,
      cantidad_usada: it.cantidad_usada,
      prioridad_denuncia: prioridad || null,
      categoria_denuncia: categoria || null,
    }));

    const resUso = await supabase.from("uso_materiales_reparacion").insert(filasUso).select("id").limit(1);
    if (resUso.error) return resUso;

    // 2. Insertar en recursos_asignados (Flujo de almacén Técnico ↔ Admin)
    const filasAsignados = items.map((it) => ({
      id_denuncia: denunciaId,
      id_material: it.material_id,
      cantidad_asignada: it.cantidad_usada,
      estado_solicitud: "aprobada"
    }));

    await supabase.from("recursos_asignados").insert(filasAsignados);

    return resUso;
  },

  async actualizarStock({ entidadId, materialId, nuevaCantidad }) {
    return await supabase
      .from("inventario_entidad")
      .update({ cantidad: nuevaCantidad, actualizado_el: new Date().toISOString() })
      .eq("entidad_id", entidadId)
      .eq("material_id", materialId)
      .select("entidad_id,material_id,cantidad,stock_minimo")
      .single();
  },
};

