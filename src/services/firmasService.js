import { supabase } from "../core/supabaseClient";

/**
 * H011 + H014 — Servicio de Firmas (Apoyo Social)
 * Tabla: firmas (id_denuncia, id_ciudadano)
 */

/** Verificar si el usuario actual ya firmó una denuncia */
export async function verificarFirma(denunciaId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("firmas")
    .select("id")
    .eq("id_denuncia", denunciaId)
    .eq("id_ciudadano", user.id)
    .maybeSingle();

  return Boolean(data);
}

/** Verificar firmas en batch */
export async function verificarFirmasBatch(denunciaIds) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  const { data } = await supabase
    .from("firmas")
    .select("id_denuncia")
    .eq("id_ciudadano", user.id)
    .in("id_denuncia", denunciaIds);

  const mapa = {};
  (data || []).forEach((f) => { mapa[f.id_denuncia] = true; });
  return mapa;
}

/** Firmar una denuncia */
export async function firmarReporte(denunciaId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Debes iniciar sesión para firmar.");

  const { error } = await supabase
    .from("firmas")
    .insert([{ id_denuncia: denunciaId, id_ciudadano: user.id }]);

  if (error) {
    if (error.message.includes("duplicate") || error.message.includes("unique")) {
      throw new Error("Ya firmaste este reporte.");
    }
    throw new Error(error.message);
  }
}

/** Retirar firma (H014) */
export async function retirarFirma(denunciaId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Debes iniciar sesión.");

  const { error } = await supabase
    .from("firmas")
    .delete()
    .eq("id_denuncia", denunciaId)
    .eq("id_ciudadano", user.id);

  if (error) throw new Error(error.message);
}

/** Contar firmas totales */
export async function contarFirmas(denunciaId) {
  const { count } = await supabase
    .from("firmas")
    .select("id", { count: "exact", head: true })
    .eq("id_denuncia", denunciaId);

  return count || 0;
}
