import { supabase } from "../core/supabaseClient";

const TABLA_KANBAN = "tareas_kanban";

/**
 * Obtiene todas las tareas del tablero Kanban para la entidad del admin logueado.
 * Hace JOIN con denuncias para obtener datos completos del reporte.
 */
export async function obtenerTareasKanban() {
  const { data, error } = await supabase
    .from(TABLA_KANBAN)
    .select(`
      id,
      id_denuncia,
      indice_columna,
      fecha_inicio,
      fecha_fin,
      creado_el,
      actualizado_el,
      denuncias (
        id, titulo, descripcion, prioridad, categoria, estado,
        departamento, municipio, direccion, url_imagen, creado_el
      )
    `)
    .order("creado_el", { ascending: false });

  if (error) {
    console.error("Error cargando kanban:", error.message);
    return { data: [], error: error.message };
  }

  // Aplanar: mezclar datos de la tarea kanban con datos de la denuncia
  const tareas = (data || []).map((t) => ({
    kanban_id: t.id,
    id: t.id_denuncia,
    indice_columna: t.indice_columna,
    fecha_fin: t.fecha_fin,
    creado_kanban: t.creado_el,
    ...(t.denuncias || {}),
  }));

  return { data: tareas, error: null };
}

/**
 * Agrega una denuncia al tablero Kanban (columna 0 = Cola).
 */
export async function agregarAlTablero(idDenuncia, entidadId) {
  // Si se proporciona entidadId, asignar la denuncia a esa entidad primero
  if (entidadId) {
    const { error: updateError } = await supabase
      .from("denuncias")
      .update({ entidad_id: entidadId })
      .eq("id", idDenuncia);

    if (updateError) {
      console.warn("No se pudo asignar la denuncia a la entidad:", updateError.message);
    }
  }

  const { data, error } = await supabase
    .from(TABLA_KANBAN)
    .insert([{
      id_denuncia: idDenuncia,
      indice_columna: 0,
      fecha_inicio: new Date().toISOString(),
    }])
    .select("id")
    .single();

  if (error) {
    // Si ya existe, no es un error crítico
    if (error.code === "23505") {
      return { data: null, error: "Esta denuncia ya está en el tablero." };
    }
    throw new Error(`No se pudo agregar al tablero: ${error.message}`);
  }
  return { data, error: null };
}

/**
 * Mueve una tarea entre columnas del Kanban.
 * @param {string} idDenuncia - ID de la denuncia
 * @param {number} indiceColumna - 0=Cola, 1=En Reparación, 2=Completado
 */
export async function moverTarea(idDenuncia, indiceColumna, comentarioCierre = "") {
  const actualizacion = { indice_columna: indiceColumna };

  // Si se mueve a "Completado", registrar fecha_fin
  if (indiceColumna === 2) {
    actualizacion.fecha_fin = new Date().toISOString();
  } else {
    // Si se saca de completado, limpiar fecha_fin
    actualizacion.fecha_fin = null;
  }

  const { error } = await supabase
    .from(TABLA_KANBAN)
    .update(actualizacion)
    .eq("id_denuncia", idDenuncia);

  if (error) {
    throw new Error(`No se pudo mover la tarea: ${error.message}`);
  }

  // También sincronizar el estado en denuncias y guardar el comentario de cierre
  const MAPA_ESTADOS = ["pendiente", "en_reparacion", "completado"];
  const updateDenuncia = { estado: MAPA_ESTADOS[indiceColumna] || "pendiente" };
  
  if (indiceColumna === 2 && comentarioCierre) {
    updateDenuncia.comentario_cierre = comentarioCierre;
  } else if (indiceColumna !== 2) {
    updateDenuncia.comentario_cierre = null;
  }

  await supabase
    .from("denuncias")
    .update(updateDenuncia)
    .eq("id", idDenuncia);

  return { status: "success" };
}

/**
 * Quita una tarea del tablero Kanban (no elimina la denuncia).
 */
export async function quitarDelTablero(idDenuncia) {
  const { error } = await supabase
    .from(TABLA_KANBAN)
    .delete()
    .eq("id_denuncia", idDenuncia);

  if (error) {
    throw new Error(`No se pudo quitar del tablero: ${error.message}`);
  }

  // Resetear el estado de la denuncia a pendiente
  await supabase
    .from("denuncias")
    .update({ estado: "pendiente" })
    .eq("id", idDenuncia);
}

/**
 * Verifica si una denuncia ya está en el tablero Kanban.
 */
export async function estaEnTablero(idDenuncia) {
  const { data } = await supabase
    .from(TABLA_KANBAN)
    .select("id")
    .eq("id_denuncia", idDenuncia)
    .maybeSingle();

  return !!data;
}

export async function obtenerIdsEnTablero() {
  const { data } = await supabase
    .from(TABLA_KANBAN)
    .select("id_denuncia");
  
  const mapa = {};
  (data || []).forEach(t => { mapa[t.id_denuncia] = true; });
  return mapa;
}

export async function asignarResponsable(idDenuncia, idTecnico) {
  const { error } = await supabase
    .from(TABLA_KANBAN)
    .update({ id_responsable: idTecnico || null })
    .eq("id_denuncia", idDenuncia);

  if (error) throw new Error(`No se pudo asignar responsable: ${error.message}`);
}

export async function asignarCuadrilla(idDenuncia, idCuadrilla) {
  const { error } = await supabase
    .from(TABLA_KANBAN)
    .update({ id_cuadrilla_asignada: idCuadrilla || null })
    .eq("id_denuncia", idDenuncia);

  if (error) throw new Error(`No se pudo asignar cuadrilla: ${error.message}`);

  if (idCuadrilla) {
    const { data: cuadrilla } = await supabase
      .from("cuadrillas_base")
      .select("id_lider")
      .eq("id", idCuadrilla)
      .maybeSingle();

    if (cuadrilla) {
      const { data: miembros } = await supabase
        .from("cuadrilla_miembros")
        .select("id_empleado")
        .eq("id_cuadrilla", idCuadrilla);

      const ayudantes = (miembros || []).map(m => m.id_empleado);
      const encargado = cuadrilla.id_lider;
      const ayudante = ayudantes[0] || encargado;

      const { data: existente } = await supabase
        .from("cuadrilla_obra")
        .select("id")
        .eq("id_denuncia", idDenuncia)
        .maybeSingle();

      if (existente) {
        await supabase
          .from("cuadrilla_obra")
          .update({ id_tecnico_encargado: encargado, id_tecnico_ayudante: ayudante })
          .eq("id_denuncia", idDenuncia);
      } else {
        await supabase
          .from("cuadrilla_obra")
          .insert([{ id_denuncia: idDenuncia, id_tecnico_encargado: encargado, id_tecnico_ayudante: ayudante }]);
      }
    }
  }
}

export async function obtenerTareaDetalle(idDenuncia) {
  const { data } = await supabase
    .from(TABLA_KANBAN)
    .select("id_responsable, id_cuadrilla_asignada")
    .eq("id_denuncia", idDenuncia)
    .maybeSingle();

  return data || { id_responsable: null, id_cuadrilla_asignada: null };
}
