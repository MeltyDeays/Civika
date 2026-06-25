import { supabase } from "../core/supabaseClient";

const TABLA = "sugerencias";

const CAMPOS_BASE =
  "id,id_ciudadano,entidad_id,titulo,descripcion,estado,area_destino,prioridad,departamento,municipio,creado_el,actualizado_el,es_destacado,fecha_fin_destacado,direccion,lat,lng,url_imagen";

function normalizarSugerencia(fila) {
  if (!fila) return null;
  return {
    ...fila,
    urgencia: fila.prioridad || "media",
    departamento: fila.departamento || "Managua",
    municipio: fila.municipio || "Managua",
    direccion: fila.direccion || "Direccion pendiente",
    lat: fila.lat ? parseFloat(fila.lat) : undefined,
    lng: fila.lng ? parseFloat(fila.lng) : undefined,
    firmas: 0,
  };
}

export async function obtenerSugerencias() {
  const { data, error } = await supabase
    .from(TABLA)
    .select(CAMPOS_BASE)
    .order("creado_el", { ascending: false });

  if (error) {
    console.error("Error cargando sugerencias:", error.message);
    return { data: [], source: "error", error: error.message };
  }

  return {
    data: (data || []).map(normalizarSugerencia),
    source: "supabase",
    error: null,
  };
}

export async function crearSugerencia(payload) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Debes iniciar sesión para crear una sugerencia.");

  const insercion = {
    titulo: payload.titulo,
    descripcion: payload.descripcion,
    estado: "pendiente",
    id_ciudadano: user.id,
    area_destino: payload.area_destino || null,
    prioridad: payload.urgencia || payload.prioridad || "media",
    departamento: payload.departamento || null,
    municipio: payload.municipio || null,
    direccion: payload.direccion || null,
    lat: payload.lat || null,
    lng: payload.lng || null,
    url_imagen: payload.url_imagen || null,
  };

  const { data, error } = await supabase
    .from(TABLA)
    .insert([insercion])
    .select(CAMPOS_BASE)
    .single();

  if (error) {
    throw new Error(`No se pudo crear la propuesta: ${error.message}`);
  }

  return normalizarSugerencia(data);
}

export async function actualizarSugerencia(idSugerencia, payload) {
  const actualizacion = {
    titulo: payload.titulo,
    descripcion: payload.descripcion,
    prioridad: payload.prioridad || payload.urgencia || "media",
    departamento: payload.departamento || null,
    municipio: payload.municipio || null,
    direccion: payload.direccion || null,
    lat: payload.lat || null,
    lng: payload.lng || null,
    url_imagen: payload.url_imagen || null,
  };

  const { data, error } = await supabase
    .from(TABLA)
    .update(actualizacion)
    .eq("id", idSugerencia)
    .select(CAMPOS_BASE)
    .single();

  if (error) {
    throw new Error(`No se pudo actualizar la sugerencia: ${error.message}`);
  }

  return normalizarSugerencia(data);
}

export async function eliminarSugerencia(idSugerencia) {
  const { error } = await supabase
    .from(TABLA)
    .delete()
    .eq("id", idSugerencia);

  if (error) {
    throw new Error(`No se pudo eliminar la sugerencia: ${error.message}`);
  }
}

