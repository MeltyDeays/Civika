import { supabase } from "../core/supabaseClient";

/**
 * H016 — Servicio de Pagos (Mock)
 * Tabla: pagos (id_denuncia, id_ciudadano, monto, moneda, metodo_pago)
 */

const DELAY_SIMULACION_MS = 2000;

/** Simula procesamiento bancario (2s) y registra pago */
export async function procesarPagoSimulado({ denunciaId, monto, metodoPago }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Debes iniciar sesión para pagar.");

  // Simular procesamiento bancario
  await new Promise((resolve) => setTimeout(resolve, DELAY_SIMULACION_MS));

  // Registrar pago en BD
  const { error: pagoError } = await supabase.from("pagos").insert([{
    id_denuncia: denunciaId,
    id_ciudadano: user.id,
    monto,
    moneda: "NIO",
    metodo_pago: metodoPago || "tarjeta_simulada",
  }]);

  if (pagoError) throw new Error(`Error al registrar pago: ${pagoError.message}`);

  // Marcar denuncia como destacada
  const { error: destError } = await supabase
    .from("denuncias")
    .update({
      es_destacado: true,
      fecha_fin_destacado: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq("id", denunciaId);

  if (destError) throw new Error(`Pago registrado pero no se pudo destacar: ${destError.message}`);
}

/** Obtener historial de pagos de una denuncia */
export async function obtenerPagosDenuncia(denunciaId) {
  const { data, error } = await supabase
    .from("pagos")
    .select("id,monto,moneda,metodo_pago,creado_el")
    .eq("id_denuncia", denunciaId)
    .order("creado_el", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}
