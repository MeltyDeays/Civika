import { supabase } from "../core/supabaseClient";
import { aPuntoWkt, parsearPuntoGeo } from "../utils/formatters";
import { validarReporteAntiSpam } from "./iaService";

const TABLA = "denuncias";

const CAMPOS_BASE =
  "id,id_ciudadano,entidad_id,titulo,descripcion,estado,prioridad,categoria,problematica_id,ubicacion,url_imagen,direccion,departamento,municipio,es_destacado,fecha_fin_destacado,comentario_cierre,creado_el,actualizado_el,es_visible,firmas:firmas(count),problematica:problematicas(id,nombre,icono)";

function normalizarReporte(fila) {
  if (!fila) return null;
  const geo = parsearPuntoGeo(fila.ubicacion);
  const totalFirmas = Array.isArray(fila.firmas) ? fila.firmas[0]?.count || 0 : Number(fila.firmas) || 0;
  return {
    ...fila,
    categoria: fila.problematica?.nombre || fila.categoria || "Otro",
    problematica_id: fila.problematica_id,
    urgencia: fila.prioridad || "media",
    direccion: fila.direccion || "Direccion pendiente",
    departamento: fila.departamento || "Managua",
    municipio: fila.municipio || "Managua",
    firmas: totalFirmas,
    lat: geo?.lat,
    lng: geo?.lng,
  };
}

/**
 * H017 — Limpiar reportes destacados cuya fecha de expiración ya pasó.
 * Se ejecuta cada vez que se cargan los reportes (sin cron/job externo).
 */
async function expirarDestacados() {
  try {
    await supabase
      .from(TABLA)
      .update({ es_destacado: false })
      .eq("es_destacado", true)
      .lt("fecha_fin_destacado", new Date().toISOString());
  } catch (e) {
    // No bloquear la carga si falla la limpieza
    console.warn("H017: Error al expirar destacados:", e.message);
  }
}

export async function obtenerReportes() {
  try {
    // H017: Auto-expirar destacados vencidos antes de cargar
    await expirarDestacados();

    const { data, error } = await supabase
      .from(TABLA)
      .select(CAMPOS_BASE)
      .order("creado_el", { ascending: false });

    if (error) {
      console.error("Error cargando denuncias:", error.message);
      return { data: [], source: "error", error: error.message };
    }

    return {
      data: (data || []).map(normalizarReporte),
      source: "supabase",
      error: null,
    };
  } catch (e) {
    console.error("Excepción en obtenerReportes:", e.message);
    return { data: [], source: "error", error: e.message };
  }
}

export async function crearReporte(payload) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Debes iniciar sesión para reportar.");

  // 1. Validar el reporte en tiempo real con el Agente de IA antes de insertar
  const evaluacionIA = await validarReporteAntiSpam({
    titulo: payload.titulo,
    descripcion: payload.descripcion,
    lat: payload.lat,
    lng: payload.lng
  });

  // Si se detecta un duplicado semántico cercano
  if (evaluacionIA.esDuplicado) {
    throw new Error(`[DUPLICADO_DETECTADO] ${evaluacionIA.textoRespuesta}`);
  }

  // La asignación de entidad la maneja el trigger de BD `asignar_entidad_por_categoria`
  // No duplicar lógica en el frontend
  const insercion = {
    titulo: payload.titulo,
    descripcion: payload.descripcion,
    estado: "pendiente",
    prioridad: payload.prioridad || "media",
    categoria: payload.categoria || "Otro",
    problematica_id: payload.problematica_id || null,
    url_imagen: payload.url_imagen || null,
    direccion: payload.direccion || null,
    departamento: payload.departamento || null,
    municipio: payload.municipio || null,
    id_ciudadano: user.id,
    // entidad_id se asigna automáticamente via trigger `trg_auto_asignar_entidad`
    ubicacion: aPuntoWkt(payload.lat, payload.lng),
  };

  const { data, error } = await supabase
    .from(TABLA)
    .insert([insercion])
    .select(CAMPOS_BASE)
    .single();

  if (error) {
    console.error("Error Supabase al insertar:", error);
    throw new Error(error.message);
  }

  return normalizarReporte(data);
}

export async function actualizarReporte(idReporte, payload) {
  const actualizacion = {
    titulo: payload.titulo,
    descripcion: payload.descripcion,
    prioridad: payload.prioridad || "media",
    categoria: payload.categoria || "Otro",
    problematica_id: payload.problematica_id || null,
    url_imagen: payload.url_imagen || null,
    direccion: payload.direccion || null,
    departamento: payload.departamento || null,
    municipio: payload.municipio || null,
    // actualizado_el lo maneja el trigger de BD `update_actualizado_el_column`
    ubicacion: aPuntoWkt(payload.lat, payload.lng),
  };

  const { data, error } = await supabase
    .from(TABLA)
    .update(actualizacion)
    .eq("id", idReporte)
    .select(CAMPOS_BASE)
    .single();

  if (error) throw new Error(error.message);
  return normalizarReporte(data);
}

export async function eliminarReporte(idReporte) {
  const { error } = await supabase.from(TABLA).delete().eq("id", idReporte);
  if (error) throw new Error(error.message);
}

export async function toggleVisibilidad(idReporte, visible) {
  const { data, error } = await supabase
    .from(TABLA)
    .update({ es_visible: visible })
    .eq("id", idReporte)
    .select(CAMPOS_BASE)
    .single();

  if (error) throw new Error(error.message);
  return normalizarReporte(data);
}

export function exportarCSV(reportes) {
  const headers = ["ID", "Título", "Estado", "Prioridad", "Categoría", "Departamento", "Municipio", "Fecha", "Firmas"];
  
  const escapeCSV = (str) => {
    if (!str) return '""';
    const cleanStr = String(str).replace(/"/g, '""');
    return `"${cleanStr}"`;
  };

  const rows = reportes.map(r => [
    escapeCSV(r.id),
    escapeCSV(r.titulo),
    escapeCSV(r.estado),
    escapeCSV(r.prioridad || r.urgencia),
    escapeCSV(r.categoria),
    escapeCSV(r.departamento),
    escapeCSV(r.municipio),
    escapeCSV(new Date(r.creado_el).toLocaleDateString()),
    escapeCSV(r.firmas)
  ]);

  const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `reportes_${new Date().getTime()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
