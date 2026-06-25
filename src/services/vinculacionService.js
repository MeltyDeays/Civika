import { supabase } from "../core/supabaseClient";

export const vinculacionService = {
  async vincularCodigo(userId, codigoInvitacion) {
    const { data: invitacion, error: invError } = await supabase
      .from("invitaciones_empleados")
      .select("id, entidad_id, usado, especialidad")
      .eq("codigo", codigoInvitacion)
      .single();

    if (invError || !invitacion) throw new Error("Código de invitación inválido o no encontrado.");
    if (invitacion.usado) throw new Error("Este código de invitación ya ha sido utilizado.");

    const { error: perfilError } = await supabase
      .from("perfiles")
      .update({
        rol: "tecnico",
        id_entidad: invitacion.entidad_id,
        especialidad: invitacion.especialidad,
      })
      .eq("id", userId);

    if (perfilError) throw new Error(`Fallo al vincular perfil: ${perfilError.message}`);

    await supabase
      .from("invitaciones_empleados")
      .update({ usado: true })
      .eq("id", invitacion.id);

    return { entidadId: invitacion.entidad_id, especialidad: invitacion.especialidad };
  },
};
