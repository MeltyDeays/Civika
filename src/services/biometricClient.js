const API_BASE = import.meta.env.VITE_BIOMETRIC_API_URL || "/api/biometric";

/**
 * Envía selfie (post-liveness) y cédula al backend Java para verificación biométrica.
 */
export async function verificarIdentidadBiometrica({
  selfieBase64,
  cedulaFrenteBase64,
  cedulaAtrasBase64,
  cedulaEscrita,
  nombreEscrito,
  livenessClient = true,
}) {
  const url = `${API_BASE}/biometrics/verify`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      selfieBase64,
      cedulaFrenteBase64,
      cedulaAtrasBase64,
      cedulaEscrita,
      nombreEscrito,
      livenessClient,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      text || `Error del servidor biométrico (${res.status})`
    );
  }

  const data = await res.json();
  return {
    valido: data.verified ?? data.valido ?? false,
    motivo: data.motivo || data.error || "Verificación completada",
    score: data.score ?? 0,
    checks: data.checks ?? {},
  };
}
