import { useEffect, useMemo, useState } from "react";
import { ordenReparacionAdminEntidadModel } from "../Components/AdminEntidad/Modelos/ordenReparacionModel";
import { EMOJIS_ESPECIALIDAD } from "../Components/AdminEntidad/Vistas/CuadrillasView";

export default function RepairOrderModal({ abierto, entidadId, denuncia, tecnicoId: tecnicoIdProp, alCerrar, alConfirmar }) {
  const [inventario, setInventario] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [cuadrillas, setCuadrillas] = useState([]);
  const [tipoAsignacion, setTipoAsignacion] = useState("solo"); // "solo" | "cuadrilla"
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState(tecnicoIdProp || "");
  const [cuadrillaSeleccionada, setCuadrillaSeleccionada] = useState("");
  const [seleccion, setSeleccion] = useState({});
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (abierto) {
      setSeleccion({});
      setError("");
      setTipoAsignacion("solo");
      setTecnicoSeleccionado(tecnicoIdProp || "");
      setCuadrillaSeleccionada("");
    }
  }, [abierto, tecnicoIdProp]);

  useEffect(() => {
    let activo = true;
    async function cargar() {
      if (!abierto || !entidadId) return;
      setError("");
      const [resInv, resTec, resCua] = await Promise.all([
        ordenReparacionAdminEntidadModel.listarInventario(entidadId),
        ordenReparacionAdminEntidadModel.listarTecnicos(entidadId),
        ordenReparacionAdminEntidadModel.listarCuadrillas(entidadId)
      ]);
      if (!activo) return;
      if (resInv.error) {
        setError(resInv.error.message);
        setInventario([]);
      } else {
        setInventario(resInv.data || []);
      }
      setTecnicos(resTec.data || []);
      setCuadrillas(resCua?.data || []);
    }
    cargar();
    return () => {
      activo = false;
    };
  }, [abierto, entidadId]);

  const inventarioDisponible = useMemo(() => {
    return (inventario || [])
      .map((row) => ({
        material_id: row.material_id,
        nombre: row.materiales?.nombre || "Material",
        unidad: row.materiales?.unidad_medida || "unidad",
        cantidad: Number(row.cantidad || 0),
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [inventario]);

  if (!abierto) return null;

  const onChangeCantidad = (materialId, value) => {
    const n = Number(value);
    setSeleccion((prev) => ({ ...prev, [materialId]: Number.isFinite(n) ? n : 0 }));
  };

  const confirmar = async () => {
    setError("");
    setEnviando(true);
    try {
      if (!entidadId) throw new Error("Entidad no disponible");
      if (!denuncia?.id) throw new Error("Denuncia no seleccionada");

      const items = Object.entries(seleccion)
        .map(([materialId, cantidad]) => ({ material_id: materialId, cantidad_usada: Number(cantidad || 0) }))
        .filter((it) => it.cantidad_usada > 0);

      if (!items.length) throw new Error("Selecciona al menos un material y cantidad > 0");

      let idResponsable = null;
      let idCuadrilla = null;
      
      if (tipoAsignacion === "solo" && tecnicoSeleccionado) {
        idResponsable = tecnicoSeleccionado;
      } else if (tipoAsignacion === "cuadrilla" && cuadrillaSeleccionada) {
        const c = cuadrillas.find(x => x.id === cuadrillaSeleccionada);
        if (c) {
          idResponsable = c.id_lider;
          idCuadrilla = c.id;
        }
      }

      // Validar stock y descontar
      for (const it of items) {
        const row = inventarioDisponible.find((x) => x.material_id === it.material_id);
        const actual = row?.cantidad ?? 0;
        if (it.cantidad_usada > actual) {
          throw new Error(`Stock insuficiente para "${row?.nombre || "material"}" (disponible: ${actual})`);
        }
        const nuevo = Math.round((actual - it.cantidad_usada) * 100) / 100;
        const upd = await ordenReparacionAdminEntidadModel.actualizarStock({
          entidadId,
          materialId: it.material_id,
          nuevaCantidad: nuevo,
        });
        if (upd.error) throw new Error(upd.error.message);
      }

      const res = await ordenReparacionAdminEntidadModel.registrarConsumo({
        entidadId,
        denunciaId: denuncia.id,
        idResponsable,
        idCuadrilla,
        items,
        prioridad: denuncia.prioridad || null,
        categoria: denuncia.categoria || null,
      });
      if (res.error) throw new Error(res.error.message);

      await alConfirmar?.();
      alCerrar?.();
      setSeleccion({});
    } catch (e) {
      setError(e.message || "No se pudo registrar la orden");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={alCerrar}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Orden de reparacion</h3>
          <button className="ghost-btn" type="button" onClick={alCerrar}>
            Cerrar
          </button>
        </div>

        <p className="muted">
          Denuncia: <strong>{denuncia?.titulo}</strong>
        </p>

        {error ? <p className="error-text">{error}</p> : null}

        {/* H025 / V7 — Selector Híbrido (Solo o Cuadrilla) */}
        <div style={{ padding: '0 4px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <button className={tipoAsignacion === 'solo' ? "primary-btn" : "ghost-btn"} style={{ flex: 1, padding: '6px' }} onClick={() => setTipoAsignacion('solo')}>
              👤 Individual
            </button>
            <button className={tipoAsignacion === 'cuadrilla' ? "primary-btn" : "ghost-btn"} style={{ flex: 1, padding: '6px' }} onClick={() => setTipoAsignacion('cuadrilla')}>
              🛡️ Cuadrilla
            </button>
          </div>

          {tipoAsignacion === "solo" ? (
            <select className="minimal-select" style={{ width: '100%' }} value={tecnicoSeleccionado} onChange={(e) => setTecnicoSeleccionado(e.target.value)}>
              <option value="">-- Sin asignar --</option>
              {tecnicos.map((tec) => (
                <option key={tec.id} value={tec.id}>{EMOJIS_ESPECIALIDAD[tec.especialidad] || '🛠️'} {tec.nombre_completo}</option>
              ))}
            </select>
          ) : (
            <select className="minimal-select" style={{ width: '100%' }} value={cuadrillaSeleccionada} onChange={(e) => setCuadrillaSeleccionada(e.target.value)}>
              <option value="">-- Sin asignar --</option>
              {cuadrillas.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          )}
        </div>

        <div className="list-stack" style={{ maxHeight: 340, overflow: "auto", padding: '4px' }}>
          {inventarioDisponible.map((row) => (
            <article key={row.material_id} className="list-card" style={{ padding: '1rem', background: '#f8fafc' }}>
              <div style={{ flex: 1 }}>
                <span className="label-premium" style={{ marginBottom: '2px', fontSize: '11px' }}>Material</span>
                <h3 style={{ margin: 0, fontSize: '15px' }}>{row.nombre}</h3>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>
                  Disponible: <strong>{row.cantidad} {row.unidad}</strong>
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                <span className="label-premium" style={{ fontSize: '10px' }}>Cantidad a usar</span>
                <input
                  className="field"
                  style={{ width: 100, textAlign: 'center' }}
                  type="number"
                  min="0"
                  step="0.01"
                  value={seleccion[row.material_id] ?? ""}
                  onChange={(e) => onChangeCantidad(row.material_id, e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </article>
          ))}
        </div>

        <div className="modal-actions">
          <button className="secondary-btn" type="button" onClick={alCerrar} disabled={enviando}>
            Cancelar
          </button>
          <button className="primary-btn" type="button" onClick={confirmar} disabled={enviando}>
            {enviando ? "Guardando..." : "Confirmar y descontar"}
          </button>
        </div>
      </div>
    </div>
  );
}

