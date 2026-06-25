export function formatearFecha(fechaIso) {
  if (!fechaIso) return "Sin fecha";
  return new Intl.DateTimeFormat("es-NI", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(fechaIso));
}

export function aPuntoWkt(latitud, longitud) {
  if (!latitud || !longitud) return null;
  return `POINT(${Number(longitud)} ${Number(latitud)})`;
}

export function parsearPuntoGeo(valor) {
  if (!valor) return null;
  // Soporte para GeoJSON (objeto con type:"Point" y coordinates:[lng,lat])
  if (typeof valor === 'object' && valor.type === 'Point' && Array.isArray(valor.coordinates)) {
    return { lng: Number(valor.coordinates[0]), lat: Number(valor.coordinates[1]) };
  }
  if (typeof valor === "string") {
    // Soporte para WKT: "POINT(-85.3689 12.0909)"
    const wkt = valor.match(/POINT\(([-0-9.]+)\s+([-0-9.]+)\)/i);
    if (wkt) return { lng: Number(wkt[1]), lat: Number(wkt[2]) };

    // Soporte para EWKB hexadecimal (retornado por PostgREST para columnas geography)
    // Formato: 01 01000020 E6100000 [8 bytes lng] [8 bytes lat]
    if (/^[0-9a-fA-F]{40,}$/.test(valor)) {
      try {
        // EWKB Point: byte order (2) + type (8) + SRID (8) + X/lng (16) + Y/lat (16) = 50 hex chars mínimo
        const buf = new Uint8Array(valor.length / 2);
        for (let i = 0; i < valor.length; i += 2) {
          buf[i / 2] = parseInt(valor.substring(i, i + 2), 16);
        }
        const view = new DataView(buf.buffer);
        const littleEndian = buf[0] === 1; // 01 = little-endian
        // Determinar offset de coordenadas según si tiene SRID
        const typeInt = view.getUint32(1, littleEndian);
        const hasSRID = (typeInt & 0x20000000) !== 0;
        const coordOffset = hasSRID ? 9 : 5; // 1(endian) + 4(type) + 4(srid) = 9, o sin SRID = 5
        const lng = view.getFloat64(coordOffset, littleEndian);
        const lat = view.getFloat64(coordOffset + 8, littleEndian);
        if (isFinite(lng) && isFinite(lat) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
          return { lng, lat };
        }
      } catch {
        return null;
      }
    }
  }
  return null;
}
