// Archivo: src/services/iaClient.js
// Cliente Groq y OpenRouter. Requiere claves en .env.local.
import { createOpenAI } from "@ai-sdk/openai";
import { generateText, tool } from "ai";
import { z } from "zod";
import { hasGroqKeys, withGroqKeyRotation } from "./groqKeyPool";

const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY || "";

function createGroqClient(apiKey) {
  return createOpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey,
  });
}

function createOpenRouterClient(apiKey) {
  return createOpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
  });
}

async function generateWithAI({ groqModel, openrouterModel, options }) {
  if (openRouterKey) {
    try {
      const openrouter = createOpenRouterClient(openRouterKey);
      return await generateText({ model: openrouter(openrouterModel), ...options });
    } catch (err) {
      console.warn("Fallo al generar con OpenRouter, intentando Groq...", err);
      if (!hasGroqKeys()) throw err;
    }
  }

  if (hasGroqKeys()) {
    return withGroqKeyRotation(async (apiKey) => {
      const groq = createGroqClient(apiKey);
      return generateText({ model: groq(groqModel), ...options });
    });
  }

  throw new Error("IA no configurada. Define VITE_GROQ_API_KEY o VITE_OPENROUTER_API_KEY en .env.local");
}

const IA_NO_CONFIGURADA = "IA no configurada. Define VITE_GROQ_API_KEY o VITE_OPENROUTER_API_KEY en .env.local";

export const tieneIA = () => hasGroqKeys() || !!openRouterKey;

/**
 * Llama al LLM para validar duplicidad y spam en un reporte.
 */
export async function llamarModeracionAntiSpam(nuevoReporte, reportesCercanos) {
  if (!tieneIA()) throw new Error(IA_NO_CONFIGURADA);
  const response = await generateWithAI({
    groqModel: "llama-3.3-70b-versatile",
    openrouterModel: "meta-llama/llama-3.3-70b-instruct",
    options: {
      system: `Eres el agente de control de calidad y prevención de duplicados de CivicReport. 
      Tu objetivo es evaluar si el reporte que introduce el ciudadano ya ha sido registrado previamente basándote en la similitud semántica de su descripción y su cercanía geográfica.
      Sé conciso y directo. Si es duplicado, genera un mensaje informando educadamente al ciudadano de que su reporte ya está registrado y en revisión.`,
      prompt: `Nuevo reporte a evaluar:
      Título: "${nuevoReporte.titulo}"
      Descripción: "${nuevoReporte.descripcion}"
      
      Reportes activos cercanos ya existentes en el área (radio 150m):
      ${JSON.stringify(reportesCercanos)}`,
    }
  });
  return response.text;
}

/**
 * Llama al LLM para deducir inventario consumido a partir del comentario de resolución.
 */
export async function llamarDeduccionInventario(textoResolucion, catalogo) {
  if (!tieneIA()) throw new Error(IA_NO_CONFIGURADA);
  const descuentosParaAplicar = [];
  const response = await generateWithAI({
    groqModel: "llama-3.3-70b-versatile",
    openrouterModel: "meta-llama/llama-3.3-70b-instruct",
    options: {
      system: `Eres el agente de logística y almacén de CivicReport.
      Tu labor es deducir qué materiales del catálogo se usaron y en qué cantidades basándote en el comentario de resolución de la obra.
      Genera el listado de materiales y llama a la herramienta para descontarlos.`,
      prompt: `Catálogo de materiales disponibles:
      ${JSON.stringify(catalogo)}
      
      Texto de resolución de la cuadrilla: "${textoResolucion}"`,
      tools: {
        descontar_material: tool({
          description: "Descuenta la cantidad de un material específico del inventario de la entidad.",
          parameters: z.object({
            materialId: z.string().uuid(),
            cantidad: z.number().positive()
          }),
          execute: async ({ materialId, cantidad }) => {
            descuentosParaAplicar.push({ materialId, cantidad });
            return { success: true };
          }
        })
      },
      maxSteps: 3
    }
  });
  return {
    textoRespuesta: response.text,
    descuentosParaAplicar
  };
}

/**
 * Llama al LLM para generar un reporte ejecutivo analítico.
 */
export async function llamarReporteEjecutivo(nombreEntidad, totalSemanales, categoriasStr) {
  if (!tieneIA()) throw new Error(IA_NO_CONFIGURADA);
  const response = await generateWithAI({
    groqModel: "llama-3.3-70b-versatile",
    openrouterModel: "meta-llama/llama-3.3-70b-instruct",
    options: {
      system: `Eres un analista de planeación urbana experto de CivicReport para la entidad "${nombreEntidad}". 
      Tu labor es redactar un reporte ejecutivo analítico gubernamental basándote exclusivamente en las estadísticas provistas. 
      Sé formal, constructivo, conciso pero descriptivo (máximo 4-5 párrafos, entre 200 y 250 palabras en total, balanceando el resumen y recomendaciones ejecutivas sin extenderte de forma innecesaria). 
      Está estrictamente prohibido mencionar o sugerir acciones sobre otras competencias ajenas a "${nombreEntidad}".`,
      prompt: `Estadísticas de denuncias de los últimos días para la entidad "${nombreEntidad}":
      Total reportes: ${totalSemanales}
      Desglose por categorías: ${categoriasStr}`,
    }
  });
  return response.text;
}

/**
 * Llama al LLM para procesar la consulta del chatbot y retornar respuesta estructurada.
 */
export async function llamarChatbotAnalitico(mensaje, contextoDatos) {
  if (!tieneIA()) throw new Error(IA_NO_CONFIGURADA);
  const response = await generateWithAI({
    groqModel: "llama-3.3-70b-versatile",
    openrouterModel: "meta-llama/llama-3.3-70b-instruct",
    options: {
      system: `Eres el Bot de IA oficial de CivicReport ("CivicReport's Bot").
      Tu rol es conversar y responder consultas analíticas basándote únicamente en los datos reales de la entidad del administrador logueado.
      Los datos analíticos reales actuales de la entidad son: ${JSON.stringify(contextoDatos)}.
      
      Si el usuario te pide visualizar, graficar, ver, mostrar o comparar estadísticas (de denuncias, cuadrillas, categorías, nivel de impacto, geográficas, mapa, etc.), DEBES obligatoriamente estructurar tu respuesta como un objeto JSON con el siguiente formato:
      {
        "respuesta": "Texto analítico estructurado que describe los datos y los KPI de la entidad.",
        "grafico": {
          "tipo": "barras" | "columnas" | "dispersion" | "mapa" | "pastel" | "lineas",
          "datos": [
            { "etiqueta": "Etiqueta del Item (ej: Municipio, Categoría o Estado)", "valor": 12 }
          ]
        }
      }
      
      Instrucciones de formato e inspiración de observabilidad (Grafana & Firecrawl Dashboard Reporting) para la propiedad 'respuesta':
      - Comienza con una fila de STAT CARDS (Métricas de un solo valor) usando emojis y corchetes.
      - Estructura el análisis aplicando el método RED/USE:
        1. Rate (Tasa de reportes entrantes o volumen total).
        2. Saturation/Errors (Capacidad de resolución de las cuadrillas).
        3. Duration (Distribución temporal o prioridades).
      - Termina con una sección de advertencias o sugerencias de optimización breves.

      Instrucciones de mapeo de datos reales para gráficos:
      1. Denuncias por Estado: Mapea "denunciasPorEstado".
      2. Denuncias por Categoría: Mapea "denunciasPorCategoría".
      3. Denuncias por Nivel de Impacto: Mapea "denunciasPorNivelImpacto".
      4. Resolución de Cuadrillas: Mapea "resolucionCuadrillas".
      5. Gráfico de Dispersión: Asigna valores coherentes para X e Y.
      6. Mapa Geográfico (tipo "mapa"): Mapea "denunciasPorDepartamento" o "denunciasPorMunicipio".
      7. Gráfico de Pastel (tipo "pastel") y Gráfico de Líneas (tipo "lineas"): Mapea cualquier agregación pertinente.
      8. Gráfico de Líneas (tipo "lineas"): Mapea estadísticas temporales o de volumen.

      Si no hay datos registrados (valores en 0), genera de todos modos el gráfico con valores en 0 e indícale amigablemente en "respuesta" cómo puede registrar denuncias o asignar cuadrillas para empezar.
      Si el usuario NO te pide visualizar, graficar ni ver datos, responde en texto plano de manera directa sin formato JSON.`,
      prompt: mensaje
    }
  });
  return response.text;
}

/**
 * Llama al LLM de Visión para validar la selfie y la cédula.
 */
export async function llamarValidacionIdentidad({ selfieBase64, cedulaFrenteBase64, cedulaAtrasBase64, cedulaEscrita, nombreEscrito }) {
  if (!tieneIA()) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    return {
      valido: true,
      motivo: "Validación de identidad completada (Modo de demostración: sin claves de IA en .env.local)."
    };
  }

  try {
    console.log("Tamaños de payload Base64 para Visión:", {
      selfie: selfieBase64?.length,
      cedulaFrente: cedulaFrenteBase64?.length,
      cedulaAtras: cedulaAtrasBase64?.length,
      totalAproximadoBytes: ((selfieBase64?.length || 0) + (cedulaFrenteBase64?.length || 0) + (cedulaAtrasBase64?.length || 0)) * 0.75
    });

    const response = await generateWithAI({
      groqModel: "meta-llama/llama-4-scout-17b-16e-instruct",
      openrouterModel: "google/gemini-2.5-flash",
      options: {
        system: `Eres el agente de verificación de identidad de CivicReport. Tu tarea es analizar rigurosamente tres imágenes para verificar la identidad de un ciudadano y prevenir el fraude por fotos incorrectas o repetidas.
        
        Recibes tres imágenes en este orden estricto:
        - IMAGEN 1: Selfie (Fotografía del rostro del usuario tomado directamente por la cámara).
        - IMAGEN 2: Cédula Frente (Fotografía del lado frontal de la tarjeta física de la Cédula de Identidad de Nicaragua).
        - IMAGEN 3: Cédula Atrás (Fotografía del lado trasero de la tarjeta física de la Cédula de Identidad de Nicaragua).
  
        Criterios estrictos de aprobación (Si falla cualquiera de estos, debes establecer "valido": false y dar el motivo detallado):
        1. Validación Estructural del Documento (CRÍTICO): 
           - La IMAGEN 2 (Cédula Frente) y la IMAGEN 3 (Cédula Atrás) deben ser imágenes completamente diferentes correspondientes a los lados opuestos de la tarjeta de identidad.
           - La IMAGEN 2 (Cédula Frente) DEBE ser una fotografía del frente de la tarjeta física de la cédula. Debe mostrar el escudo de Nicaragua, el título oficial, el número de cédula, la firma y la foto pequeña del ciudadano impresa en la tarjeta. Si en su lugar muestra el reverso (código de barras, código MRZ con caracteres "<<<"), o si es una selfie directa de cara, debes rechazar de inmediato (valido: false) indicando: "La foto del frente de la cédula no corresponde al lado frontal del documento".
           - La IMAGEN 3 (Cédula Atrás) DEBE mostrar obligatoriamente el reverso de la tarjeta física de la cédula (con el código de barras y franjas de caracteres "<<<"). Si se subió la misma foto del frente o una selfie aquí, debes rechazar de inmediato (valido: false) indicando: "La foto del reverso de la cédula no corresponde al lado trasero del documento".
        2. Similitud Facial: Compara las facciones físicas principales del rostro de la IMAGEN 1 (Selfie) con el rostro pequeño impreso en la tarjeta de la IMAGEN 2 (Cédula Frente). Sé flexible con iluminación y edad (la foto del documento suele ser de hace años), pero asegúrate de que sea la misma persona.
        3. Coincidencia de Datos: El número de cédula escrito y el nombre completo escrito por el usuario deben coincidir con los que aparecen legibles en la IMAGEN 2 (Cédula Frente).
        
        Debes retornar ÚNICAMENTE un JSON estrictamente estructurado en el siguiente formato, sin preámbulos ni explicaciones adicionales fuera de las llaves del JSON:
        {
          "valido": true | false,
          "motivo": "Explicación detallada en español de la comparación de rasgos y campos que justifique la aprobación o el rechazo."
        }`,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: `Por favor verifica si el usuario es válido contrastando la información escrita con las imágenes adjuntas.
              - Nombre completo escrito: "${nombreEscrito}"
              - Número de cédula escrito: "${cedulaEscrita}"
              
              IMAGEN 1 (Selfie del ciudadano):` },
              { type: "image", image: selfieBase64, mimeType: "image/jpeg" },
              { type: "text", text: "IMAGEN 2 (Parte frontal de la Cédula física de identidad):" },
              { type: "image", image: cedulaFrenteBase64, mimeType: "image/jpeg" },
              { type: "text", text: "IMAGEN 3 (Parte trasera de la Cédula física de identidad):" },
              { type: "image", image: cedulaAtrasBase64, mimeType: "image/jpeg" }
            ]
          }
        ]
      }
    });

    const respuestaLimpia = response.text.trim();
    console.log("Respuesta cruda de Visión:", respuestaLimpia);
    const indexInicio = respuestaLimpia.indexOf("{");
    const indexFin = respuestaLimpia.lastIndexOf("}");

    if (indexInicio !== -1 && indexFin !== -1 && indexFin > indexInicio) {
      const posibleJson = respuestaLimpia.substring(indexInicio, indexFin + 1);
      return JSON.parse(posibleJson);
    }

    const cleanText = response.text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Error en validación biométrica:", error);
    throw new Error("Fallo en la validación por IA: " + error.message);
  }
}
