// Archivo: src/services/iaService.js
import { supabase } from "../core/supabaseClient";
import * as iaClient from "./iaClient";

const MAPA_SINONIMOS = {
  "fallo de luz": ["fallo de luz", "alumbrado", "electricidad", "luz"],
  "baches": ["baches", "bache", "calle", "carretera", "asfalto", "vía", "pavimento"],
  "fuga de agua": ["fuga de agua", "agua", "tubería", "tubo", "alcantarillado", "hidrante", "inundación"],
  "basura": ["basura", "desechos", "limpieza", "vertedero", "residuos", "basurero"]
};

export function perteneceAProblematica(categoria, problematicaNombre) {
  if (!categoria || !problematicaNombre) return false;
  const catLower = categoria.toLowerCase().trim();
  const probLower = problematicaNombre.toLowerCase().trim();
  
  if (catLower === probLower) return true;
  
  const sinonimos = MAPA_SINONIMOS[probLower];
  if (sinonimos && sinonimos.some(s => catLower.includes(s) || s.includes(catLower))) {
    return true;
  }
  return false;
}

/**
 * CASO DE USO 2: Filtro de Moderación Semántica y Anti-Spam
 * Compara reportes entrantes con reportes existentes geolocalizados en PostGIS
 */
export async function validarReporteAntiSpam(nuevoReporte) {
  // Ejecutar búsqueda geográfica de reportes activos a un radio de 150 metros
  const { data: cercanos, error: errCercanos } = await supabase.rpc("buscar_denuncias_por_radio", {
    lat_origen: Number(nuevoReporte.lat),
    lng_origen: Number(nuevoReporte.lng),
    radio_metros: 150.0
  });

  if (errCercanos) {
    console.error("Error al buscar denuncias por radio:", errCercanos.message);
  }

  const reportesCercanos = cercanos || [];

  if (iaClient.tieneIA()) {
    try {
      const text = await iaClient.llamarModeracionAntiSpam(nuevoReporte, reportesCercanos);
      const esDuplicado = text.toLowerCase().includes("duplicado") || text.toLowerCase().includes("ya registrado");
      return {
        textoRespuesta: text,
        esDuplicado
      };
    } catch (e) {
      console.warn("Excepción al consultar modelo IA en iaClient. Iniciando fallback heurístico local...", e.message);
    }
  }

  // Fallback heurístico local (sin claves Groq en .env.local o fallo de red)
  if (reportesCercanos.length > 0) {
    // Buscar si alguna palabra clave del título coincide con las denuncias cercanas
    const palabrasNuevas = nuevoReporte.titulo.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    for (const reporte of reportesCercanos) {
      const palabrasExistentes = reporte.titulo.toLowerCase().split(/\s+/);
      const coincidencia = palabrasNuevas.some(palabra => palabrasExistentes.includes(palabra));
      if (coincidencia) {
        return {
          textoRespuesta: `Gracias. Este problema ("${reporte.titulo}") ya fue reportado cercano a tu ubicación y se encuentra en revisión.`,
          esDuplicado: true
        };
      }
    }
  }

  return {
    textoRespuesta: "Reporte validado con éxito.",
    esDuplicado: false
  };
}

/**
 * CASO DE USO 4: Procesamiento de Lenguaje Natural para Deducción de Inventario
 * Extrae materiales y cantidades a partir del texto de resolución de una cuadrilla
 */
export async function procesarInventarioDesdeTexto(textoResolucion, entidadId) {
  // Obtener catálogo de materiales de la base de datos
  const { data: catalogo, error: errCat } = await supabase
    .from("materiales")
    .select("id, nombre, unidad_medida");

  if (errCat || !catalogo) {
    console.error("Error al obtener catálogo de materiales:", errCat?.message);
    return { resumenEjecucion: "Error al acceder al inventario." };
  }

  const descuentosParaAplicar = [];

  if (iaClient.tieneIA()) {
    try {
      const { textoRespuesta, descuentosParaAplicar: deducidos } = await iaClient.llamarDeduccionInventario(textoResolucion, catalogo);
      
      // Aplicar los descuentos deducidos por la IA en la BD
      for (const item of deducidos) {
        await aplicarDescuentoInventario(entidadId, item.materialId, item.cantidad);
      }

      return { resumenEjecucion: textoRespuesta };
    } catch (e) {
      console.warn("Excepción en procesamiento de inventario IA. Usando fallback Regex local...", e.message);
    }
  }

  // Fallback heurístico local (sin claves Groq en .env.local)
  // Busca patrones como "3 sacos", "2 tubos", "5 bolsas" combinados con nombres de materiales
  const palabrasTexto = textoResolucion.toLowerCase();
  for (const mat of catalogo) {
    const nombreMat = mat.nombre.toLowerCase();
    // Crear una expresión regular flexible para encontrar números cerca del nombre del material
    const regex = new RegExp(`(\\d+)\\s*(?:sacos|bolsas|unidades|metros|tubos|de)?\\s*${nombreMat.substring(0, 10)}`, 'i');
    const match = palabrasTexto.match(regex);
    if (match) {
      const cantidad = Number(match[1]);
      if (cantidad > 0) {
        descuentosParaAplicar.push({ materialId: mat.id, nombre: mat.nombre, cantidad });
        await aplicarDescuentoInventario(entidadId, mat.id, cantidad);
      }
    }
  }

  if (descuentosParaAplicar.length > 0) {
    const listado = descuentosParaAplicar.map(d => `${d.cantidad} unidades de ${d.nombre}`).join(", ");
    return { resumenEjecucion: `Descuento automático de inventario aplicado para: ${listado}.` };
  }

  return { resumenEjecucion: "No se identificaron consumos de materiales específicos en el texto." };
}

// Función auxiliar para restar materiales del inventario de una entidad pública
async function aplicarDescuentoInventario(entidadId, materialId, cantidadADescuentar) {
  try {
    const { data: inv, error: errFetch } = await supabase
      .from("inventario_entidad")
      .select("cantidad")
      .eq("entidad_id", entidadId)
      .eq("material_id", materialId)
      .maybeSingle();

    if (errFetch) throw errFetch;

    if (!inv) {
      // Si el material no estaba en el stock de la entidad, lo insertamos con cantidad negativa
      await supabase
        .from("inventario_entidad")
        .insert([{ entidad_id: entidadId, material_id: materialId, cantidad: -cantidadADescuentar }]);
    } else {
      const nuevaCantidad = Number(inv.cantidad) - cantidadADescuentar;
      await supabase
        .from("inventario_entidad")
        .update({ cantidad: nuevaCantidad })
        .eq("entidad_id", entidadId)
        .eq("material_id", materialId);
    }
  } catch (e) {
    console.error(`Error al actualizar inventario para entidad ${entidadId}, material ${materialId}:`, e.message);
  }
}

/**
 * CASO DE USO 5: Generador de Alertas y Reportes Ejecutivos Semanales
 * Procesa estadísticas brutas y redacta reportes ejecutivos predictivos para tomadores de decisiones
 */
export async function generarReporteEjecutivoSemanal(entidadId) {
  try {
    // Obtener información de la entidad
    const { data: entidad } = await supabase
      .from("entidades_admin")
      .select("nombre")
      .eq("id", entidadId)
      .maybeSingle();

    const nombreEntidad = entidad?.nombre || "la entidad";

    // Obtener problemáticas asignadas a esta entidad para filtrar denuncias
    const { data: entProbs } = await supabase
      .from("entidad_problematica")
      .select("problematica:problematicas(nombre)")
      .eq("entidad_id", entidadId);

    const categoriasValidas = (entProbs || [])
      .map(p => p.problematica?.nombre?.toLowerCase())
      .filter(Boolean);

    // Obtener estadísticas de reportes de la entidad
    const { data: reportes, error: errRep } = await supabase
      .from("denuncias")
      .select("categoria, municipio, creado_el")
      .eq("entidad_id", entidadId);

    if (errRep) throw errRep;

    // Filtrar reportes para que correspondan únicamente a las problemáticas designadas a la entidad
    const reportesFiltrados = (reportes || []).filter(r => {
      if (!r.categoria) return false;
      if (categoriasValidas.length === 0) return true;
      return categoriasValidas.some(catValida => perteneceAProblematica(r.categoria, catValida));
    });

    // Calcular métricas locales
    const totalSemanales = reportesFiltrados.length;
    const porCategoria = {};
    reportesFiltrados.forEach(r => {
      porCategoria[r.categoria] = (porCategoria[r.categoria] || 0) + 1;
    });

    const categoriasStr = Object.entries(porCategoria).map(([k, v]) => `${k}: ${v}`).join(", ");
    let reporteEscrito = "";

    if (iaClient.tieneIA()) {
      try {
        reporteEscrito = await iaClient.llamarReporteEjecutivo(nombreEntidad, totalSemanales, categoriasStr);
      } catch (e) {
        console.warn("Excepción al generar reporte semanal con IA en iaClient. Usando plantilla local...", e.message);
      }
    }

    if (!reporteEscrito) {
      // Generación automática del reporte usando una plantilla analítica ejecutiva
      reporteEscrito = `CIVICREPORT - INFORME EJECUTIVO ANALÍTICO: ${nombreEntidad.toUpperCase()}

Durante el período evaluado, la entidad gestionó un total de ${totalSemanales} denuncias ciudadanas activas.
Análisis de incidencias principales: ${categoriasStr || "Sin registros recientes"}.

Se sugiere priorizar recursos hacia las categorías de mayor impacto en "${nombreEntidad}" para optimizar el tiempo de respuesta.`;
    }

    // Insertar el reporte en la tabla de reportes ejecutivos con su correspondiente gráfico
    await supabase.from("reportes_ejecutivos_ia").insert([{
      id_entidad: entidadId,
      contenido_reporte: reporteEscrito,
      datos_grafico: porCategoria
    }]);

    return {
      contenido: reporteEscrito,
      datosGrafico: porCategoria
    };
  } catch (e) {
    console.error("Error en agente de Alertas Ejecutivas:", e.message);
    return {
      contenido: "No se pudo generar el reporte analítico en este momento.",
      datosGrafico: {}
    };
  }
}

/**
 * Agente de Chatbot Analítico: CivicReport's Bot
 * Procesa consultas del administrador en lenguaje natural y devuelve texto y datos estructurados para graficación en base a la entidad logueada.
 */
export async function procesarConsultaChatbot(mensaje, entidadId) {
  try {
    // 1. Obtener problemáticas asignadas a esta entidad para filtrar denuncias
    const { data: entProbs } = await supabase
      .from("entidad_problematica")
      .select("problematica:problematicas(nombre)")
      .eq("entidad_id", entidadId);

    const categoriasValidas = (entProbs || [])
      .map(p => p.problematica?.nombre?.toLowerCase())
      .filter(Boolean);

    // 2. Obtener denuncias de la entidad y tareas kanban de forma paralela para evitar problemas RLS en relaciones inversas
    const [resDenuncias, resKanban] = await Promise.all([
      supabase
        .from("denuncias")
        .select("id, estado, categoria, prioridad, creado_el, municipio, departamento")
        .eq("entidad_id", entidadId),
      supabase
        .from("tareas_kanban")
        .select("id_denuncia, indice_columna")
    ]);

    const todasDenuncias = resDenuncias.data || [];
    const todosKanban = resKanban.data || [];

    const kanbanMap = {};
    todosKanban.forEach(tk => {
      if (tk.id_denuncia) {
        kanbanMap[tk.id_denuncia] = tk.indice_columna;
      }
    });

    const denunciasConKanban = todasDenuncias.map(d => ({
      ...d,
      indice_columna: kanbanMap[d.id] !== undefined ? kanbanMap[d.id] : null
    }));

    // Filtrar reportes para que correspondan únicamente a las problemáticas designadas a la entidad
    const denuncias = denunciasConKanban.filter(r => {
      if (!r.categoria) return false;
      if (categoriasValidas.length === 0) return true;
      return categoriasValidas.some(catValida => perteneceAProblematica(r.categoria, catValida));
    });

    // 3. Obtener cuadrillas y calcular su resolución usando cuadrillas_base, cuadrilla_miembros y tareas_kanban
    const { data: cuadrillasBase } = await supabase
      .from("cuadrillas_base")
      .select("id, nombre, id_lider")
      .eq("id_entidad", entidadId);

    const listaCuadrillas = cuadrillasBase || [];
    const idsCuadrillas = listaCuadrillas.map(c => c.id);

    let miembros = [];
    if (idsCuadrillas.length > 0) {
      const { data: miembrosRes } = await supabase
        .from("cuadrilla_miembros")
        .select("id_cuadrilla, id_empleado")
        .in("id_cuadrilla", idsCuadrillas);
      miembros = miembrosRes || [];
    }

    // Obtener técnicos de la cuadrilla (líder + ayudantes)
    const tecnicosIds = Array.from(new Set([
      ...listaCuadrillas.map(c => c.id_lider).filter(Boolean),
      ...miembros.map(m => m.id_empleado).filter(Boolean)
    ]));

    let tareasKanban = [];
    if (tecnicosIds.length > 0) {
      const { data: tareasRes } = await supabase
        .from("tareas_kanban")
        .select("id_responsable, id_denuncia, denuncias!inner(estado)")
        .in("id_responsable", tecnicosIds);
      tareasKanban = tareasRes || [];
    }

    // 4. Compilar datos analíticos reales y limpios
    const statsDenuncias = { pendiente: 0, en_reparacion: 0, completado: 0 };
    const porCategoria = {};
    const porImpacto = { critica: 0, alta: 0, media: 0, baja: 0 };
    const porDepartamento = {};
    const porMunicipio = {};

    denuncias.forEach(d => {
      // Determinar estado real basado en el Kanban
      let estadoReal = d.estado;
      if (d.indice_columna !== null && d.indice_columna !== undefined) {
        if (d.indice_columna === 0) estadoReal = "pendiente";
        else if (d.indice_columna === 1) estadoReal = "en_reparacion";
        else if (d.indice_columna === 2) estadoReal = "completado";
      }

      if (statsDenuncias[estadoReal] !== undefined) statsDenuncias[estadoReal]++;
      if (d.categoria) porCategoria[d.categoria] = (porCategoria[d.categoria] || 0) + 1;
      
      const impactoNormalizado = (d.prioridad || "media").toLowerCase()
        .replace("crítica", "critica")
        .replace("crítico", "critica")
        .replace("critico", "critica");
      if (porImpacto[impactoNormalizado] !== undefined) {
        porImpacto[impactoNormalizado]++;
      }

      if (d.departamento) {
        const dep = d.departamento.trim();
        porDepartamento[dep] = (porDepartamento[dep] || 0) + 1;
      }
      if (d.municipio) {
        const mun = d.municipio.trim();
        porMunicipio[mun] = (porMunicipio[mun] || 0) + 1;
      }
    });

    const statsCuadrillas = listaCuadrillas.map(c => {
      const miembrosCuadrilla = [
        c.id_lider,
        ...miembros.filter(m => m.id_cuadrilla === c.id).map(m => m.id_empleado)
      ].filter(Boolean);

      const tareasDeLaCuadrilla = tareasKanban.filter(t => miembrosCuadrilla.includes(t.id_responsable));
      const total = tareasDeLaCuadrilla.length;
      const completadas = tareasDeLaCuadrilla.filter(t => t.denuncias?.estado === "completado").length;
      const resolucionPct = total > 0 ? Math.round((completadas / total) * 100) : 0;

      return { nombre: c.nombre, total, completadas, resolucionPct };
    });

    const contextoDatos = {
      denunciasPorEstado: statsDenuncias,
      denunciasPorCategoria: porCategoria,
      denunciasPorNivelImpacto: porImpacto,
      denunciasPorDepartamento: porDepartamento,
      denunciasPorMunicipio: porMunicipio,
      resolucionCuadrillas: statsCuadrillas
    };

    let respuestaTexto = "";
    let graficoDetectado = null;

    if (iaClient.tieneIA()) {
      try {
        const text = await iaClient.llamarChatbotAnalitico(mensaje, contextoDatos);
        const respuestaLimpia = text.trim();
        const indexInicio = respuestaLimpia.indexOf("{");
        const indexFin = respuestaLimpia.lastIndexOf("}");

        if (indexInicio !== -1 && indexFin !== -1 && indexFin > indexInicio) {
          const posibleJson = respuestaLimpia.substring(indexInicio, indexFin + 1);
          try {
            const parsed = JSON.parse(posibleJson);
            respuestaTexto = parsed.respuesta || "Aquí tienes el gráfico solicitado:";
            graficoDetectado = parsed.grafico;
          } catch (errJson) {
            console.warn("Fallo al parsear JSON extraído del chatbot:", errJson.message);
            respuestaTexto = respuestaLimpia;
          }
        } else {
          respuestaTexto = respuestaLimpia;
        }
      } catch (e) {
        console.error("Error al procesar mensaje con Groq en iaClient:", e);
      }
    }

    if (!respuestaTexto) {
      respuestaTexto = "Hola, soy el asistente virtual de CivicReport. Puedo ayudarte a graficar la distribución de denuncias o evaluar la productividad de las cuadrillas. Prueba escribiendo: 'grafica las denuncias por estado'.";
    }

    return { texto: respuestaTexto, grafico: graficoDetectado };
  } catch (err) {
    console.error("Error en procesarConsultaChatbot:", err);
    return { texto: "Ocurrió un error en el asistente virtual de CivicReport.", grafico: null };
  }
}
