import { supabase } from "../../../core/supabaseClient";
import { uploadFile } from "../../../services/storageService";

/**
 * Modelo de Tareas del Técnico
 * Queries filtradas por técnico asignado
 */
export const tareasTecnicoModel = {
  async listarAsignadas(tecnicoId) {
    const [resTareas, resCuadrilla] = await Promise.all([
      supabase.from("tareas_kanban").select("id_denuncia").eq("id_responsable", tecnicoId),
      supabase.from("cuadrilla_obra").select("id_denuncia").or(`id_tecnico_encargado.eq.${tecnicoId},id_tecnico_ayudante.eq.${tecnicoId}`)
    ]);

    const idsResponsable = (resTareas.data || []).map(t => t.id_denuncia);
    const idsCuadrilla = (resCuadrilla.data || []).map(t => t.id_denuncia);
    const ids = [...new Set([...idsResponsable, ...idsCuadrilla])];
    if (!ids.length) return { data: [], error: null };

    return await supabase
      .from("denuncias")
      .select("id,titulo,descripcion,estado,prioridad,categoria,municipio,departamento,direccion,ubicacion,url_imagen,creado_el,actualizado_el,comentario_cierre")
      .in("id", ids)
      .order("creado_el", { ascending: false });
  },

  /** H051: Historial de tareas completadas o rechazadas */
  async obtenerHistorial(tecnicoId) {
    const { data: tareas } = await supabase
      .from("tareas_kanban")
      .select("id_denuncia")
      .eq("id_responsable", tecnicoId);

    const ids = [...new Set((tareas || []).map(t => t.id_denuncia))];
    if (!ids.length) return { data: [], error: null };

    return await supabase
      .from("denuncias")
      .select("id,titulo,descripcion,estado,prioridad,categoria,municipio,departamento,direccion,ubicacion,url_imagen,creado_el,actualizado_el,comentario_cierre")
      .in("id", ids)
      .in("estado", ["completado", "rechazado"])
      .order("actualizado_el", { ascending: false });
  },

  /** Cambiar estado de una denuncia con comentario de cierre obligatorio */
  async cambiarEstado(denunciaId, nuevoEstado, comentario = "") {
    const esFinal = nuevoEstado === "completado" || nuevoEstado === "rechazado";

    const payload = {
      estado: nuevoEstado,
    };

    // H026: Comentario obligatorio para estados finales
    if (esFinal) {
      payload.comentario_cierre = comentario || null;
    }

    const { error } = await supabase
      .from("denuncias")
      .update(payload)
      .eq("id", denunciaId);

    if (error) throw new Error(error.message);
    return nuevoEstado;
  },

  /** Listar recursos asignados a una denuncia */
  async listarRecursos(denunciaId) {
    return await supabase
      .from("recursos_asignados")
      .select("id,id_material,cantidad_asignada,estado_solicitud,justificacion_extra,url_foto_justificacion,creado_el,materiales(id,nombre,unidad_medida)")
      .eq("id_denuncia", denunciaId)
      .order("creado_el", { ascending: false });
  },

  /** Solicitar recurso extra con foto justificativa */
  async solicitarRecursoExtra({ denunciaId, materialId, cantidad, justificacion, urlFoto }) {
    const { error } = await supabase
      .from("recursos_asignados")
      .insert([{
        id_denuncia: denunciaId,
        id_material: materialId,
        cantidad_asignada: cantidad,
        estado_solicitud: "pendiente_revision",
        justificacion_extra: justificacion,
        url_foto_justificacion: urlFoto || null,
      }]);

    if (error) throw new Error(error.message);
  },

  /** Subir foto justificativa a Supabase Storage */
  async subirFoto(archivo) {
    // Usamos el servicio centralizado que incluye la compresión al 80%
    return await uploadFile("fotos", archivo, "justificaciones");
  },

  /** Listar técnicos de la misma entidad (para cuadrilla) */
  async listarCompaneros(entidadId, tecnicoActualId) {
    const { data, error } = await supabase
      .from("perfiles")
      .select("id,nombre_completo")
      .eq("id_entidad", entidadId)
      .eq("rol", "tecnico")
      .neq("id", tecnicoActualId)
      .order("nombre_completo");

    if (error) return [];
    return data || [];
  },

  /** Crear cuadrilla de trabajo */
  async crearCuadrilla(denunciaId, encargadoId, ayudanteIds) {
    const filas = ayudanteIds.map((id) => ({
      id_denuncia: denunciaId,
      id_tecnico_encargado: encargadoId,
      id_tecnico_ayudante: id,
    }));

    const { error } = await supabase.from("cuadrilla_obra").insert(filas);
    if (error) throw new Error(error.message);
  },

  /** Listar catálogo de materiales (para selector) */
  async listarMateriales() {
    const { data, error } = await supabase
      .from("materiales")
      .select("id,nombre,unidad_medida")
      .order("nombre");
    if (error) throw new Error(error.message);
    return data || [];
  },
};
