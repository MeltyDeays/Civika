# CivicReport Biometric Service (Java / Spring Boot)

API REST desacoplada para anti-spoofing, análisis de textura OpenCV y comparación facial estricta (umbral 90%).

## Requisitos

- Java 17+ (instalado: Microsoft OpenJDK 17)
- Maven 3.9+ (incluido en `../../tools/apache-maven-3.9.6` del monorepo)

### Variables de entorno (ya configuradas en el perfil de usuario)

| Variable | Valor |
|----------|-------|
| `JAVA_HOME` | `C:\Program Files\Microsoft\jdk-17.0.19.10-hotspot` |
| `MAVEN_HOME` | `C:\Users\everd\Downloads\Eliab\CivicReport\tools\apache-maven-3.9.6` |

> **Nota:** Cierra y reabre la terminal (o Cursor) para que `mvn` y `java` usen JDK 17 por defecto en nuevas sesiones.

## Arranque

```bash
cd backend/biometric-service
mvn spring-boot:run
```

Servidor: `http://localhost:8080`

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/biometrics/verify` | Verificación biométrica (alias: `/api/identity/verify`) |

### Request JSON

```json
{
  "selfieBase64": "<base64 sin prefijo data:>",
  "cedulaFrenteBase64": "<base64>",
  "cedulaAtrasBase64": "<opcional>",
  "cedulaEscrita": "121-041204-1006N",
  "nombreEscrito": "María Alejandra López Pérez",
  "livenessClient": true
}
```

### Response JSON

```json
{
  "verified": true,
  "valido": true,
  "score": 0.92,
  "motivo": "Identidad verificada...",
  "error": null,
  "checks": { "texture": {}, "onnxSpoof": {}, "faceMatchScore": 0.92 }
}
```

En caso de fraude: `"verified": false`, `"error": "SUPLANTACION_DETECTADA"` (mensaje descriptivo en `motivo`).

## Pipeline de seguridad

1. **Liveness cliente** — React + MediaPipe Face Mesh (parpadeo) antes del envío.
2. **Filtro Laplaciano** — Varianza de nitidez; rechaza imágenes borrosas o de pantalla.
3. **Histograma / Moiré** — Detecta patrones de foto-de-pantalla.
4. **Anti-spoof ONNX** — Modelo opcional `anti_spoof.onnx` (Silent-Face-Anti-Spoofing).
5. **Embeddings faciales** — Modelo opcional `face_embedding.onnx` (ArcFace/MobileFaceNet).
6. **Comparación coseno** — Umbral estricto **0.90** (90%) entre selfie y rostro en cédula.

## Modelos ONNX (tier alto)

Descarga automática (~184 MB):

```powershell
cd backend/biometric-service/scripts
.\download-models.ps1
```

| Archivo | Modelo | Tamaño |
|---------|--------|--------|
| `face_detector.onnx` | SCRFD 10G (detección + landmarks) | ~16 MB |
| `face_embedding.onnx` | ArcFace ResNet-50 w600k | ~166 MB |
| `anti_spoof.onnx` | MiniFASNetV2 | ~1.7 MB |

### GPU (RTX 4060)

1. Instala dependencias CUDA/cuDNN (una vez):

```powershell
cd backend/biometric-service/scripts
.\install-cuda-deps.ps1
```

2. El backend carga las DLLs automáticamente via `scripts/run-backend.mjs` (`npm run dev`).

3. `pom.xml` usa `onnxruntime_gpu` 1.22.0 (CUDA 12 + cuDNN 9).

Logs esperados: `ONNX Runtime usando CUDA (RTX 4060, dispositivo 0)`.

### Logs esperados al arrancar

```
ONNX Runtime usando CUDA (RTX 4060, dispositivo 0)
SCRFD ONNX cargado (provider=CUDA)
ArcFace ResNet-50 ONNX cargado (provider=CUDA)
MiniFASNetV2 anti-spoof cargado (provider=CUDA)
Motor de detección facial: scrfd-10g
```

En la API: `"faceDetectorEngine": "scrfd-10g"`, `"faceMatchEngine": "onnx-arcface-r50"`.

## Configuración (`application.yml`)

```yaml
biometric:
  thresholds:
    laplacian-variance-min: 100.0
    moire-score-max: 0.65
    onnx-spoof-min: 0.85
    face-match-min: 0.50
  onnx:
    use-gpu: true
    gpu-device-id: 0
  demo-mode: false  # true relaja checks de textura si no hay ONNX
  cors:
    allowed-origins: "http://localhost:5173"
```

## Integración con React (Vite)

El frontend en la raíz del monorepo usa proxy en `vite.config.js`:

```
/api/biometric/* → http://localhost:8080/api/*
```

Variable: `VITE_BIOMETRIC_API_URL=/api/biometric`

## Dependencias Maven

- `spring-boot-starter-web` — REST API
- `org.openpnp:opencv` — Laplacian, histograma, detección Haar
- `com.microsoft.onnxruntime:onnxruntime_gpu` — Inferencia ONNX con CUDA (RTX 4060)

## Tests

```bash
mvn test
```
