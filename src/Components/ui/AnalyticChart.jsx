import { useState } from "react";

export default function AnalyticChart({ grafico }) {
  const [idUnico] = useState(() => 'grafico_' + Math.random().toString(36).substring(2, 9));

  if (!grafico || !grafico.datos || !Array.isArray(grafico.datos)) return null;

  const descargarComoImagen = (tipoGrafico, id) => {
    const svgEl = document.querySelector(`#${id} svg`);
    if (!svgEl) return;

    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgEl);
    
    // Validar de forma robusta la presencia del atributo xmlns
    if (!svgString.includes('xmlns=')) {
      svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    // Reemplazar dimensiones relativas por fijas para renderizado universal en canvas
    svgString = svgString
      .replace(/width="100%"/g, 'width="500"')
      .replace(/height="100%"/g, 'height="260"');

    if (!svgString.includes('width=')) {
      svgString = svgString.replace(/^<svg/, '<svg width="500" height="260"');
    }

    const descargarDirectoSVG = () => {
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const a = document.createElement('a');
      a.download = `grafico_${tipoGrafico}_civicreport.svg`;
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);
    };

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = 260;
        const ctx = canvas.getContext('2d');
        
        // Fondo oscuro premium
        ctx.fillStyle = '#090d16';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);

        const a = document.createElement('a');
        a.download = `grafico_${tipoGrafico}_civicreport.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
      } catch (err) {
        console.warn("Canvas bloqueado por seguridad o error de dibujado, descargando SVG directo...", err);
        URL.revokeObjectURL(url);
        descargarDirectoSVG();
      }
    };

    img.onerror = (err) => {
      console.warn("Error cargando la imagen SVG en canvas, descargando SVG directamente...", err);
      URL.revokeObjectURL(url);
      descargarDirectoSVG();
    };

    img.src = url;
  };

  const descargarComoExcel = (tipoGrafico, datos, id) => {
    const svgEl = document.querySelector(`#${id} svg`);
    let svgHtml = '';
    if (svgEl) {
      const serializer = new XMLSerializer();
      svgHtml = serializer.serializeToString(svgEl);
      // Ajustar dimensiones en Excel
      svgHtml = svgHtml.replace(/width="[^"]+"/, 'width="350"').replace(/height="[^"]+"/, 'height="180"');
    }

    const filasHtml = datos.map(d => `
      <tr>
        <td style="background: #1e293b; color: #cbd5e1; font-weight: bold; border: 1px solid #334155; padding: 6px;">${d.etiqueta || ''}</td>
        <td style="color: #10b981; font-weight: bold; text-align: right; border: 1px solid #334155; padding: 6px;">${d.valor !== undefined ? d.valor : `X: ${d.x}, Y: ${d.y}`}</td>
      </tr>
    `).join('');

    const htmlCompleto = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #090d16; color: #ffffff; }
          table { border-collapse: collapse; }
          th { background-color: #0f172a; color: #38bdf8; font-weight: bold; border: 1px solid #1e293b; padding: 8px; }
          td { border: 1px solid #1e293b; padding: 8px; }
        </style>
      </head>
      <body>
        <h2>Reporte de Datos y Gráficos - CivicReport</h2>
        <br/>
        <table>
          <tr>
            <td valign="top">
              <table style="border: 1px solid #334155;">
                <thead>
                  <tr>
                    <th style="background-color: #1e293b; color: #38bdf8; border: 1px solid #334155; padding: 6px;">Etiqueta</th>
                    <th style="background-color: #1e293b; color: #38bdf8; border: 1px solid #334155; padding: 6px;">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  ${filasHtml}
                </tbody>
              </table>
            </td>
            <td valign="top" style="padding-left: 30px; background-color: #090d16;">
              ${svgHtml}
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlCompleto], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = `reporte_grafico_${tipoGrafico}_civicreport.xls`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id={idUnico} style={{
      marginTop: '12px', background: '#0f172a', padding: '14px',
      borderRadius: '12px', border: '1px solid #1e293b', color: '#fff'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: '800', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
          📊 Gráfico Generado ({grafico.tipo || 'barras'})
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => descargarComoImagen(grafico.tipo, idUnico)}
            title="Descargar gráfico como Imagen PNG"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '2px 6px', fontSize: '9px', color: '#cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '700', transition: 'all 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >
            🖼️ PNG
          </button>
          <button
            onClick={() => descargarComoExcel(grafico.tipo, grafico.datos, idUnico)}
            title="Descargar Datos + Gráfico a Excel (.xls)"
            style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '4px', padding: '2px 6px', fontSize: '9px', color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '700', transition: 'all 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(16,185,129,0.25)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(16,185,129,0.15)'}
          >
            📊 Excel
          </button>
        </div>
      </div>

      {/* Caso 1: Gráfico de Dispersión (dispersion) */}
      {grafico.tipo === 'dispersion' && (() => {
        const datos = grafico.datos;
        const xValores = datos.map(d => Number(d.x) || 0);
        const yValores = datos.map(d => Number(d.y) || 0);
        const maxX = Math.max(...xValores, 10);
        const maxY = Math.max(...yValores, 10);

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ position: 'relative', height: '140px', background: '#090d16', borderRadius: '8px', padding: '10px', border: '1px solid #1e293b' }}>
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                <line x1="0" y1="95" x2="100" y2="95" stroke="#334155" strokeWidth="1" />
                <line x1="5" y1="0" x2="5" y2="100" stroke="#334155" strokeWidth="1" />
                {datos.map((d, i) => {
                  const xPct = Math.min(Math.max(((Number(d.x) || 0) / maxX) * 85 + 10, 10), 95);
                  const yPct = Math.min(Math.max(90 - (((Number(d.y) || 0) / maxY) * 80), 5), 90);
                  const colorHue = 120 + i * 50;
                  return (
                    <g key={i}>
                      <circle
                        cx={xPct}
                        cy={yPct}
                        r="5"
                        fill={`hsl(${colorHue}, 80%, 55%)`}
                        stroke="#fff"
                        strokeWidth="1"
                        style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
                      >
                        <title>{`${d.etiqueta}: X=${d.x}, Y=${d.y}`}</title>
                      </circle>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '60px', overflowY: 'auto', fontSize: '9px', color: '#cbd5e1', background: '#090d16', padding: '6px', borderRadius: '6px' }}>
              {datos.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: `hsl(${120 + i * 50}, 80%, 55%)` }} />
                  <span style={{ fontWeight: '700', textTransform: 'capitalize' }}>{d.etiqueta}:</span>
                  <span>{`X=${d.x}, Y=${d.y}`}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Caso 2: Gráfico de Columnas Verticales (columnas) */}
      {grafico.tipo === 'columnas' && (() => {
        const datos = grafico.datos;
        const valores = datos.map(item => item.valor);
        const maxVal = Math.max(...valores, 1);

        return (
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '140px', background: '#090d16', borderRadius: '8px', padding: '15px 10px 5px', border: '1px solid #1e293b' }}>
            {datos.map((d, i) => {
              const pct = Math.round((d.valor / maxVal) * 100);
              const colorHue = 120 + i * 40;
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '9px', color: '#cbd5e1', fontWeight: '700', marginBottom: '4px' }}>{d.valor}</span>
                  <div style={{
                    width: '18px', height: `${Math.max(pct, 5)}%`,
                    background: `linear-gradient(180deg, hsl(${colorHue}, 85%, 42%) 0%, hsl(${colorHue}, 75%, 55%) 100%)`,
                    borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease-out',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }} />
                  <span style={{ fontSize: '8px', color: '#94a3b8', marginTop: '6px', fontWeight: '700', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '45px', textAlign: 'center' }} title={d.etiqueta}>
                    {d.etiqueta}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Caso 3: Gráfico de Mapa de Pines Geográficos (mapa) */}
      {grafico.tipo === 'mapa' && (() => {
        const datos = grafico.datos;
        const valores = datos.map(item => Number(item.valor) || 0);
        const maxVal = Math.max(...valores, 1);

        const hashString = (str) => {
          let hash = 0;
          for (let j = 0; j < str.length; j++) {
            hash = str.charCodeAt(j) + ((hash << 5) - hash);
          }
          return Math.abs(hash);
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ position: 'relative', height: '140px', background: '#090d16', borderRadius: '8px', padding: '5px', border: '1px solid #1e293b', overflow: 'hidden' }}>
              <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
                <path d="M10 20 Q 30 10 50 30 T 90 20 T 80 80 T 30 70 Z" fill="#1e293b" opacity="0.4" stroke="#334155" strokeWidth="1" />
                <path d="M20 40 Q 40 30 60 50 T 80 70" fill="none" stroke="#475569" strokeWidth="0.5" strokeDasharray="2,2" />
                {datos.map((d, i) => {
                  const h = hashString(d.etiqueta || "");
                  const x = (h % 60) + 20;
                  const y = ((h >> 3) % 50) + 25;
                  const size = Math.min(Math.max(((Number(d.valor) || 0) / maxVal) * 8 + 4, 4), 14);
                  const colorHue = 120 + i * 45;

                  return (
                    <g key={i} style={{ cursor: 'pointer' }}>
                      <circle
                        cx={x}
                        cy={y}
                        r={size * 1.6}
                        fill={`hsl(${colorHue}, 80%, 55%)`}
                        opacity="0.18"
                      />
                      <circle
                        cx={x}
                        cy={y}
                        r={size / 2}
                        fill={`hsl(${colorHue}, 90%, 50%)`}
                        stroke="#fff"
                        strokeWidth="1"
                      />
                      <text x={x} y={y - size - 1} fontSize="6px" fill="#cbd5e1" fontWeight="800" textAnchor="middle">
                        {d.etiqueta} ({d.valor})
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '55px', overflowY: 'auto', fontSize: '9px', color: '#cbd5e1', background: '#090d16', padding: '5px', borderRadius: '6px' }}>
              {datos.map((d, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', background: `hsl(${120 + i * 45}, 80%, 55%)` }} />
                    <span style={{ fontWeight: '700' }}>{d.etiqueta}</span>
                  </div>
                  <span style={{ color: '#38bdf8', fontWeight: '800' }}>{d.valor} reportes</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Caso 4: Gráfico de Pastel / Donut (pastel) */}
      {grafico.tipo === 'pastel' && (() => {
        const datos = grafico.datos;
        const total = datos.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0) || 1;
        
        let conicParts = [];
        let acumulado = 0;
        datos.forEach((d, i) => {
          const pct = Math.round(((Number(d.valor) || 0) / total) * 100);
          if (pct > 0) {
            const color = `hsl(${120 + i * 45}, 80%, 50%)`;
            conicParts.push(`${color} ${acumulado}% ${acumulado + pct}%`);
            acumulado += pct;
          }
        });
        
        if (acumulado < 100 && conicParts.length > 0) {
          const ultimoColor = `hsl(${120 + (datos.length - 1) * 45}, 80%, 50%)`;
          conicParts.push(`${ultimoColor} ${acumulado}% 100%`);
        }

        const backgroundGradient = conicParts.length > 0 ? `conic-gradient(${conicParts.join(', ')})` : '#1e293b';

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#090d16', borderRadius: '8px', padding: '12px', border: '1px solid #1e293b' }}>
            <div style={{
              position: 'relative', width: '80px', height: '80px', borderRadius: '50%',
              background: backgroundGradient, boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '50%', background: '#090d16',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
              }}>
                <span style={{ fontSize: '10px', fontWeight: '800', color: '#fff' }}>{total}</span>
                <span style={{ fontSize: '6px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Total</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, maxHeight: '80px', overflowY: 'auto', fontSize: '9px', color: '#cbd5e1' }}>
              {datos.map((d, i) => {
                const pct = Math.round(((Number(d.valor) || 0) / total) * 100);
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '2px', background: `hsl(${120 + i * 45}, 80%, 50%)` }} />
                      <span style={{ fontWeight: '700', textTransform: 'capitalize' }}>{d.etiqueta}</span>
                    </div>
                    <span style={{ fontWeight: '800', color: '#38bdf8' }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Caso 5: Gráfico de Líneas Continuas (lineas) */}
      {grafico.tipo === 'lineas' && (() => {
        const datos = grafico.datos;
        const valores = datos.map(item => Number(item.valor) || 0);
        const maxVal = Math.max(...valores, 1);
        
        const puntos = datos.map((d, i) => {
          const x = (i / (datos.length - 1 || 1)) * 75 + 12;
          const y = 85 - (((Number(d.valor) || 0) / maxVal) * 65);
          return { x, y, etiqueta: d.etiqueta, valor: d.valor };
        });

        const dPath = puntos.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ position: 'relative', height: '130px', background: '#090d16', borderRadius: '8px', padding: '10px', border: '1px solid #1e293b' }}>
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                <line x1="10" y1="20" x2="90" y2="20" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2,2" />
                <line x1="10" y1="52.5" x2="90" y2="52.5" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2,2" />
                <line x1="10" y1="85" x2="90" y2="85" stroke="#334155" strokeWidth="1" />
                {puntos.length > 1 && (
                  <path
                    d={dPath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                {puntos.map((p, i) => (
                  <g key={i}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="3.5"
                      fill="#090d16"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                    >
                      <title>{`${p.etiqueta}: ${p.valor}`}</title>
                    </circle>
                    <text x={p.x} y={p.y - 6} fontSize="5px" fill="#cbd5e1" fontWeight="800" textAnchor="middle">
                      {p.valor}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '9px', color: '#cbd5e1', background: '#090d16', padding: '5px', borderRadius: '6px' }}>
              {datos.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', background: '#38bdf8' }} />
                  <span style={{ fontWeight: '700', textTransform: 'capitalize' }}>{d.etiqueta}:</span>
                  <span style={{ color: '#10b981', fontWeight: 'bold' }}>{d.valor}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Caso 6: Gráfico de Barras Horizontales (barras o fallback) */}
      {(!grafico.tipo || grafico.tipo === 'barras') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {grafico.datos.map((d, i) => {
            const valores = grafico.datos.map(item => item.valor);
            const maxVal = Math.max(...valores, 1);
            const pct = Math.round((d.valor / maxVal) * 100);
            return (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#cbd5e1', marginBottom: '3px', fontWeight: '600' }}>
                  <span style={{ textTransform: 'capitalize' }}>{d.etiqueta}</span>
                  <span>{d.valor}</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct}%`, height: '100%',
                    background: `linear-gradient(90deg, hsl(${120 + i * 40}, 75%, 50%) 0%, hsl(${120 + i * 40}, 85%, 42%) 100%)`,
                    borderRadius: '4px', transition: 'width 0.5s ease-out'
                  }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
