import { supabase } from "../../../core/supabaseClient";

export const moderacionModel = {
  async listarCiudadanos() {
    const { data, error } = await supabase
      .from("perfiles")
      .select(`
        id,
        nombre_completo,
        cedula,
        rol,
        strikes_totales,
        estado_cuenta,
        creado_el,
        multas:multas_ciudadano(id, nivel, monto, estado, creado_el)
      `)
      .eq("rol", "ciudadano")
      .order("nombre_completo", { ascending: true });

    return { data, error };
  },

  async listarStrikesPendientes() {
    const { data, error } = await supabase
      .from("strikes_ciudadano")
      .select(`
        id,
        id_ciudadano,
        id_denuncia,
        id_entidad_reportante,
        motivo,
        estado,
        pruebas_entidad,
        creado_el,
        ciudadano:perfiles!id_ciudadano(nombre_completo, cedula),
        denuncia:denuncias(titulo, descripcion, ubicacion, direccion, departamento, municipio),
        entidad:entidades_admin(nombre)
      `)
      .eq("estado", "pendiente")
      .order("creado_el", { ascending: false });

    return { data, error };
  },

  async confirmarStrike(strikeId, ciudadanoId, superAdminId, resolucion) {
    // 1. Obtener perfil para saber sus strikes actuales
    const { data: perfil, error: errorPerfil } = await supabase
      .from("perfiles")
      .select("strikes_totales, estado_cuenta")
      .eq("id", ciudadanoId)
      .single();

    if (errorPerfil) throw errorPerfil;

    const nuevosStrikes = perfil.strikes_totales + 1;
    let nuevoEstado = perfil.estado_cuenta;

    // 2. Actualizar el strike a confirmado
    const { error: errorStrike } = await supabase
      .from("strikes_ciudadano")
      .update({
        estado: 'confirmado',
        id_super_admin: superAdminId,
        resolucion_super: resolucion || "Strike confirmado por conducta inapropiada o reporte falso comprobado.",
        resuelto_el: new Date().toISOString()
      })
      .eq("id", strikeId);

    if (errorStrike) throw errorStrike;

    // 3. Evaluar umbrales de multas y estado de la cuenta
    // Nivel 1: 3 strikes -> C$500
    // Nivel 2: 6 strikes -> C$1500
    // Nivel 3: 9 strikes -> C$3000
    // Nivel 4: 12 strikes -> C$5000 + Baneo permanente
    let montoMulta = 0;
    let nivelMulta = 0;

    if (nuevosStrikes === 3) {
      montoMulta = 500;
      nivelMulta = 1;
      nuevoEstado = 'suspendido';
    } else if (nuevosStrikes === 6) {
      montoMulta = 1500;
      nivelMulta = 2;
      nuevoEstado = 'suspendido';
    } else if (nuevosStrikes === 9) {
      montoMulta = 3000;
      nivelMulta = 3;
      nuevoEstado = 'suspendido';
    } else if (nuevosStrikes >= 12) {
      montoMulta = 5000;
      nivelMulta = 4;
      nuevoEstado = 'baneado';
    }

    // Si corresponde generar multa
    if (montoMulta > 0) {
      // Necesitamos una entidad a quien va el pago (usamos la de la denuncia o la que reportó)
      const { data: strikeData } = await supabase
        .from("strikes_ciudadano")
        .select("id_entidad_reportante")
        .eq("id", strikeId)
        .single();

      const entidadId = strikeData?.id_entidad_reportante;

      const { error: errorMulta } = await supabase
        .from("multas_ciudadano")
        .insert([{
          id_ciudadano: ciudadanoId,
          nivel: nivelMulta,
          monto: montoMulta,
          entidad_id: entidadId,
          estado: 'pendiente'
        }]);

      if (errorMulta) throw errorMulta;
    }

    // 4. Actualizar el perfil con los strikes y el estado de la cuenta
    const { error: errorUpdatePerfil } = await supabase
      .from("perfiles")
      .update({
        strikes_totales: nuevosStrikes,
        estado_cuenta: nuevoEstado
      })
      .eq("id", ciudadanoId);

    if (errorUpdatePerfil) throw errorUpdatePerfil;

    return { success: true, nuevosStrikes, nuevoEstado };
  },

  async rechazarStrike(strikeId, denunciaId, superAdminId, resolucion) {
    // 1. Marcar strike como rechazado
    const { error: errorStrike } = await supabase
      .from("strikes_ciudadano")
      .update({
        estado: 'rechazado_por_super',
        id_super_admin: superAdminId,
        resolucion_super: resolucion || "Reporte falso descartado por el Super Administrador.",
        resuelto_el: new Date().toISOString()
      })
      .eq("id", strikeId);

    if (errorStrike) throw errorStrike;

    // 2. Restaurar la denuncia a es_visible=true, es_falso_reporte=false y estado=pendiente
    const { error: errorDenuncia } = await supabase
      .from("denuncias")
      .update({
        estado: 'pendiente',
        es_falso_reporte: false,
        es_visible: true,
        motivo_falso: null
      })
      .eq("id", denunciaId);

    if (errorDenuncia) throw errorDenuncia;

    return { success: true };
  },

  async quitarStrikeManualmente(ciudadanoId) {
    const { data: perfil } = await supabase
      .from("perfiles")
      .select("strikes_totales, estado_cuenta")
      .eq("id", ciudadanoId)
      .single();

    if (!perfil) throw new Error("Perfil no encontrado");

    const nuevosStrikes = Math.max(0, perfil.strikes_totales - 1);
    let nuevoEstado = perfil.estado_cuenta;

    // Si baja del umbral de suspensión, y no tiene multas pendientes de pago, reactivar
    if (nuevosStrikes < 3 && perfil.estado_cuenta === 'suspendido') {
      const { data: multasPendientes } = await supabase
        .from("multas_ciudadano")
        .select("id")
        .eq("id_ciudadano", ciudadanoId)
        .eq("estado", "pendiente");

      if (!multasPendientes || multasPendientes.length === 0) {
        nuevoEstado = 'activo';
      }
    }

    const { error } = await supabase
      .from("perfiles")
      .update({
        strikes_totales: nuevosStrikes,
        estado_cuenta: nuevoEstado
      })
      .eq("id", ciudadanoId);

    if (error) throw error;
    return { success: true, nuevosStrikes, nuevoEstado };
  },

  async registrarPagoMulta(multaId, ciudadanoId) {
    // 1. Marcar multa como pagada
    const { error: errorMulta } = await supabase
      .from("multas_ciudadano")
      .update({
        estado: 'pagada',
        pagado_el: new Date().toISOString()
      })
      .eq("id", multaId);

    if (errorMulta) throw errorMulta;

    // 2. Verificar si quedan multas pendientes
    const { data: multasRestantes } = await supabase
      .from("multas_ciudadano")
      .select("id")
      .eq("id_ciudadano", ciudadanoId)
      .eq("estado", "pendiente");

    // 3. Si no hay más multas pendientes, restaurar la cuenta a activo (si estaba suspendido)
    if (!multasRestantes || multasRestantes.length === 0) {
      const { data: perfil } = await supabase
        .from("perfiles")
        .select("estado_cuenta, strikes_totales")
        .eq("id", ciudadanoId)
        .single();

      if (perfil && perfil.estado_cuenta === 'suspendido') {
        const { error: errorPerfil } = await supabase
          .from("perfiles")
          .update({ estado_cuenta: 'activo' })
          .eq("id", ciudadanoId);

        if (errorPerfil) throw errorPerfil;
      }
    }

    return { success: true };
  },

  async condonarMulta(multaId, ciudadanoId) {
    // 1. Marcar multa como condonada
    const { error: errorMulta } = await supabase
      .from("multas_ciudadano")
      .update({
        estado: 'condonada',
        pagado_el: new Date().toISOString()
      })
      .eq("id", multaId);

    if (errorMulta) throw errorMulta;

    // 2. Verificar si quedan multas pendientes
    const { data: multasRestantes } = await supabase
      .from("multas_ciudadano")
      .select("id")
      .eq("id_ciudadano", ciudadanoId)
      .eq("estado", "pendiente");

    if (!multasRestantes || multasRestantes.length === 0) {
      const { data: perfil } = await supabase
        .from("perfiles")
        .select("estado_cuenta")
        .eq("id", ciudadanoId)
        .single();

      if (perfil && perfil.estado_cuenta === 'suspendido') {
        const { error: errorPerfil } = await supabase
          .from("perfiles")
          .update({ estado_cuenta: 'activo' })
          .eq("id", ciudadanoId);

        if (errorPerfil) throw errorPerfil;
      }
    }

    return { success: true };
  },

  async cambiarEstadoCuenta(ciudadanoId, nuevoEstado) {
    const { error } = await supabase
      .from("perfiles")
      .update({ estado_cuenta: nuevoEstado })
      .eq("id", ciudadanoId);

    if (error) throw error;
    return { success: true };
  }
};
