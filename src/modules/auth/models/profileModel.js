import { supabase } from "../../../core/supabaseClient";

export async function fetchProfileByUserId(usuarioId) {
  const { data, error } = await supabase
    .from("perfiles")
    .select("id,cedula,nombre_completo,rol,id_entidad,especialidad,activo,estado_cuenta,foto_selfie_url,creado_el")
    .eq("id", usuarioId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateProfile(userId, campos) {
  const { data, error } = await supabase
    .from("perfiles")
    .update(campos)
    .eq("id", userId)
    .select("id,cedula,nombre_completo,rol,id_entidad,especialidad,activo,estado_cuenta,creado_el")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function desactivarCuenta(userId) {
  const { data, error } = await supabase
    .from("perfiles")
    .update({ activo: false })
    .eq("id", userId)
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data;
}
