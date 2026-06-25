import { useState } from "react";
import { procesarConsultaChatbot } from "../../services/iaService";
import AnalyticChart from "./AnalyticChart";

function RenderizadorStatCards({ texto }) {
  if (typeof texto !== 'string') return null;

  // Busca patrones como "📊 [Total: 25]" o "👥 [Cuadrillas: 4]"
  const matches = [...texto.matchAll(/([\uD800-\uDBFF][\uDC00-\uDFFF]|\S|\w+)\s*\[([^\]:]+):\s*([^\]]+)\]/g)];
  if (matches.length === 0) return null;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '8px', marginBottom: '12px', marginTop: '4px' }}>
      {matches.map((match, i) => {
        const emoji = match[1];
        const label = match[2].trim();
        const value = match[3].trim();
        const gradients = [
          'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          'linear-gradient(135deg, #022c22 0%, #064e3b 100%)',
          'linear-gradient(135deg, #311042 0%, #1e293b 100%)'
        ];
        const background = gradients[i % gradients.length];

        return (
          <div key={i} style={{
            background,
            border: '1px solid #1e293b',
            borderRadius: '10px',
            padding: '8px',
            textAlign: 'center',
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s ease-out'
          }}>
            <span style={{ fontSize: '14px', marginBottom: '2px' }}>{emoji}</span>
            <span style={{ fontSize: '8px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.3px', display: 'block', maxWidth: '85px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={label}>
              {label}
            </span>
            <span style={{ fontSize: '14px', color: '#38bdf8', fontWeight: '900', marginTop: '2px' }}>
              {value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function limpiarTextoDeCards(texto) {
  if (typeof texto !== 'string') return '';
  // Remueve las tarjetas individuales tipo "emoji [label: value]" y sus separadores
  return texto.replace(/([\uD800-\uDBFF][\uDC00-\uDFFF]|\S|\w+)\s*\[[^\]]+:\s*[^\]]+\]\s*(\|)?/g, '').trim();
}

export default function ChatbotWidget({ entidadId }) {
  const [chatAbierto, setChatAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([
    {
      remitente: "bot",
      texto: "¡Hola! Soy CivicReport's Bot 🤖. Puedo generar gráficos interactivos sobre tus denuncias, categorías y cuadrillas de forma personalizada según tus datos reales. ¿Qué deseas ver hoy?",
      fecha: new Date().toISOString()
    }
  ]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [cargandoMensaje, setCargandoMensaje] = useState(false);

  const manejarEnviarMensaje = async (e) => {
    if (e) e.preventDefault();
    if (!nuevoMensaje.trim() || cargandoMensaje) return;

    const textoUsuario = nuevoMensaje;
    setNuevoMensaje("");
    setMensajes((prev) => [...prev, { remitente: "usuario", texto: textoUsuario, fecha: new Date().toISOString() }]);
    setCargandoMensaje(true);

    try {
      const res = await procesarConsultaChatbot(textoUsuario, entidadId);
      setMensajes((prev) => [
        ...prev,
        { remitente: "bot", texto: res.texto, grafico: res.grafico, fecha: new Date().toISOString() }
      ]);
    } catch (err) {
      console.error(err);
      setMensajes((prev) => [
        ...prev,
        { remitente: "bot", texto: "Ocurrió un error al consultar con el asistente virtual.", fecha: new Date().toISOString() }
      ]);
    } finally {
      setCargandoMensaje(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000, fontFamily: 'system-ui, sans-serif' }}>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
      `}</style>
      {!chatAbierto ? (
        <button
          onClick={() => setChatAbierto(true)}
          style={{
            width: '60px', height: '60px', borderRadius: '30px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(16,185,129,0.35)', transition: 'transform 0.2s',
            fontSize: '24px', color: '#fff'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          💬
        </button>
      ) : (
        <div style={{
          width: '380px', height: '560px', borderRadius: '20px',
          background: '#fff', boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #e2e8f0'
        }}>
          {/* Cabecera */}
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%', background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'
              }}>
                🤖
              </div>
              <div>
                <div style={{ fontWeight: '800', fontSize: '14px' }}>CivicReport's Bot</div>
                <div style={{ fontSize: '10px', opacity: 0.85, fontWeight: '600' }}>En línea • Asistente Virtual</div>
              </div>
            </div>
            <button
              onClick={() => setChatAbierto(false)}
              style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer', padding: '4px' }}
            >
              ×
            </button>
          </div>

          {/* Historial de Mensajes */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mensajes.map((msg, idx) => {
              const esBot = msg.remitente === "bot";
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignSelf: esBot ? 'flex-start' : 'flex-end', maxWidth: '85%' }}>
                  <div style={{
                    background: esBot ? '#fff' : '#10b981',
                    color: esBot ? '#1e293b' : '#fff',
                    padding: '12px 16px', borderRadius: esBot ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                    fontSize: '13px', lineHeight: '1.5', fontWeight: '500',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                    border: esBot ? '1px solid #e2e8f0' : 'none'
                  }}>
                    {esBot && <RenderizadorStatCards texto={msg.texto} />}
                     <div style={{ whiteSpace: 'pre-line' }}>
                       {esBot ? limpiarTextoDeCards(msg.texto) : msg.texto}
                     </div>

                     {esBot && msg.grafico && (
                       <AnalyticChart grafico={msg.grafico} />
                     )}
                  </div>
                  <span style={{ fontSize: '9px', color: '#94a3b8', marginTop: '4px', alignSelf: esBot ? 'flex-start' : 'flex-end', fontWeight: '600' }}>
                    Hace un momento
                  </span>
                </div>
              );
            })}
            {cargandoMensaje && (
              <div style={{ display: 'flex', alignSelf: 'flex-start', background: '#fff', padding: '12px 16px', borderRadius: '16px 16px 16px 4px', border: '1px solid #e2e8f0', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out both' }}></span>
                <span style={{ width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out both 0.2s' }}></span>
                <span style={{ width: '6px', height: '6px', background: '#94a3b8', borderRadius: '50%', display: 'inline-block', animation: 'bounce 1.4s infinite ease-in-out both 0.4s' }}></span>
              </div>
            )}
          </div>

          {/* Input de Mensajes */}
          <form onSubmit={manejarEnviarMensaje} style={{
            padding: '16px 20px', borderTop: '1px solid #e2e8f0', background: '#fff',
            display: 'flex', gap: '10px', alignItems: 'center'
          }}>
            <input
              type="text"
              value={nuevoMensaje}
              onChange={e => setNuevoMensaje(e.target.value)}
              placeholder="Escribe lo que quieres graficar..."
              disabled={cargandoMensaje}
              style={{
                flex: 1, padding: '10px 16px', borderRadius: '24px', border: '1px solid #cbd5e1',
                fontSize: '13px', outline: 'none', background: '#f8fafc'
              }}
            />
            <button
              type="submit"
              disabled={cargandoMensaje || !nuevoMensaje.trim()}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: nuevoMensaje.trim() ? '#10b981' : '#e2e8f0',
                color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', transition: 'background 0.2s'
              }}
            >
              ➔
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
