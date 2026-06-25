// Archivo: src/services/groqKeyPool.js
// Claves Groq: definir en .env.local (VITE_GROQ_API_KEY, VITE_GROQ_API_KEYS, GROQ_API_KEYS).
// Vite carga .env.local automáticamente; rotación en ciclo al agotar cuota.

const ENV_FILE = ".env.local";

function parseKeys(raw) {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

function loadGroqKeys() {
  const sources = [
    import.meta.env.VITE_GROQ_API_KEYS,
    import.meta.env.VITE_GROQ_API_KEY,
    import.meta.env.GROQ_API_KEYS,
  ];
  const seen = new Set();
  const keys = [];
  for (const source of sources) {
    for (const key of parseKeys(source)) {
      if (!seen.has(key)) {
        seen.add(key);
        keys.push(key);
      }
    }
  }
  return keys;
}

const keys = loadGroqKeys();
let currentIndex = 0;

export function hasGroqKeys() {
  return keys.length > 0;
}

export function getCurrentKey() {
  return keys[currentIndex] ?? null;
}

export function rotateToNextKey() {
  if (keys.length === 0) return null;
  currentIndex = (currentIndex + 1) % keys.length;
  return getCurrentKey();
}

export function isRateLimitError(error) {
  const status =
    error?.statusCode ??
    error?.status ??
    error?.response?.status ??
    error?.cause?.statusCode;

  if (status === 429) return true;

  const message = String(
    error?.message ?? error?.responseBody ?? error?.data?.error?.message ?? ""
  ).toLowerCase();

  return (
    message.includes("rate limit") ||
    message.includes("rate_limit") ||
    message.includes("quota") ||
    message.includes("tokens per") ||
    message.includes("too many requests") ||
    message.includes("capacity")
  );
}

export async function withGroqKeyRotation(operation) {
  if (keys.length === 0) {
    throw new Error(`No hay API keys de Groq configuradas. Agrégalas en ${ENV_FILE}`);
  }

  let attempts = 0;
  const startIndex = currentIndex;

  while (attempts < keys.length) {
    const apiKey = getCurrentKey();
    try {
      return await operation(apiKey);
    } catch (error) {
      if (!isRateLimitError(error) || attempts === keys.length - 1) {
        throw error;
      }
      console.warn(
        `Groq key ${currentIndex + 1}/${keys.length} sin tokens, rotando a la siguiente...`
      );
      rotateToNextKey();
      attempts++;
    }
  }

  currentIndex = startIndex;
  throw new Error(
    "Todas las API keys de Groq agotaron su cuota. Intenta de nuevo en unos minutos."
  );
}
