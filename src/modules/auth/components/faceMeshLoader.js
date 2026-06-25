/**
 * Carga singleton de MediaPipe Face Mesh (precarga WASM una sola vez).
 */
const FACE_MESH_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh";
const INIT_TIMEOUT_MS = 12000;

let loaderPromise = null;
let cachedFaceMesh = null;

export function preloadFaceMesh() {
  if (cachedFaceMesh) return loaderPromise ?? Promise.resolve(cachedFaceMesh);
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("Tiempo de espera agotado al cargar el detector facial"));
    }, INIT_TIMEOUT_MS);

    const finish = (FaceMeshClass) => {
      clearTimeout(timeout);
      cachedFaceMesh = FaceMeshClass;
      resolve(FaceMeshClass);
    };

    if (typeof window !== "undefined" && window.FaceMesh) {
      finish(window.FaceMesh);
      return;
    }

    const script = document.createElement("script");
    script.src = `${FACE_MESH_CDN}/face_mesh.js`;
    script.async = true;
    script.onload = () => {
      if (window.FaceMesh) finish(window.FaceMesh);
      else reject(new Error("FaceMesh no disponible"));
    };
    script.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("No se pudo descargar MediaPipe"));
    };
    document.head.appendChild(script);
  });

  return loaderPromise;
}

export async function createFaceMeshInstance(onResults) {
  const FaceMesh = await preloadFaceMesh();
  const faceMesh = new FaceMesh({
    locateFile: (file) => `${FACE_MESH_CDN}/${file}`,
  });
  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: false,
    minDetectionConfidence: 0.4,
    minTrackingConfidence: 0.4,
  });
  faceMesh.onResults(onResults);
  await faceMesh.initialize();
  return faceMesh;
}

export function createDownscaledCanvas(video, maxSize = 320) {
  const vw = video.videoWidth || 640;
  const vh = video.videoHeight || 480;
  const scale = Math.min(1, maxSize / Math.max(vw, vh));
  const w = Math.round(vw * scale);
  const h = Math.round(vh * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(video, 0, 0, w, h);
  return canvas;
}
