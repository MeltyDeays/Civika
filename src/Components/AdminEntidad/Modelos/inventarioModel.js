import { supabase } from "../../../core/supabaseClient";

export const inventarioAdminEntidadModel = {
  async listarMateriales() {
    return await supabase.from("materiales").select("id,nombre,unidad_medida,categoria").order("categoria").order("nombre");
  },

  async crearMaterial({ nombre, unidad_medida, categoria }) {
    return await supabase
      .from("materiales")
      .insert([{ nombre, unidad_medida: unidad_medida || "unidad", categoria: categoria || "General" }])
      .select("id,nombre,unidad_medida,categoria")
      .single();
  },

  async listarInventario(entidadId) {
    return await supabase
      .from("inventario_entidad")
      .select("entidad_id,material_id,cantidad,stock_minimo,actualizado_el,materiales(id,nombre,unidad_medida,categoria)")
      .eq("entidad_id", entidadId)
      .order("actualizado_el", { ascending: false });
  },

  async upsertInventario({ entidadId, materialId, cantidad, stock_minimo }) {
    return await supabase
      .from("inventario_entidad")
      .upsert(
        [
          {
            entidad_id: entidadId,
            material_id: materialId,
            cantidad,
            stock_minimo: stock_minimo ?? 10,
            actualizado_el: new Date().toISOString(), // Trigger also handles this, but explicit for upsert
          },
        ],
        { onConflict: "entidad_id,material_id" }
      )
      .select("entidad_id,material_id,cantidad,stock_minimo,actualizado_el")
      .single();
  },
};

