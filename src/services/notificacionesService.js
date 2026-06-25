import { supabase } from "../core/supabaseClient";

const TABLA = "notificaciones";

export async function obtenerNotificaciones(userId) {
  try {
    const { data, error } = await supabase
      .from(TABLA)
      .select("*")
      .eq("id_destinatario", userId)
      .order("creado_el", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error cargando notificaciones:", error.message);
      return { data: [], error: error.message };
    }
    return { data: data || [], error: null };
  } catch (e) {
    console.error("Excepción en obtenerNotificaciones:", e.message);
    return { data: [], error: e.message };
  }
}

export async function marcarComoLeida(id) {
  try {
    const { data, error } = await supabase
      .from(TABLA)
      .update({ leida: true })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { data, error: null };
  } catch (e) {
    console.error("Error al marcar notificacion leida:", e.message);
    return { data: null, error: e.message };
  }
}

export async function marcarTodasLeidas(userId) {
  try {
    const { data, error } = await supabase
      .from(TABLA)
      .update({ leida: true })
      .eq("id_destinatario", userId)
      .eq("leida", false)
      .select();

    if (error) throw new Error(error.message);
    return { data, error: null };
  } catch (e) {
    console.error("Error al marcar todas leidas:", e.message);
    return { data: null, error: e.message };
  }
}

export async function contarNoLeidas(userId) {
  try {
    const { count, error } = await supabase
      .from(TABLA)
      .select("*", { count: "exact", head: true })
      .eq("id_destinatario", userId)
      .eq("leida", false);

    if (error) throw new Error(error.message);
    return { count: count || 0, error: null };
  } catch (e) {
    console.error("Error al contar no leidas:", e.message);
    return { count: 0, error: e.message };
  }
}
