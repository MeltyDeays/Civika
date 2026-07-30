# 🏛️ Civika - Plataforma Cívica de Gestión Municipal con IA y Biometría 2FA

Civika es una solución web full-stack de código abierto diseñada para la participación ciudadana, la clasificación inteligente de incidencias urbanas y la gestión operativa transparente para gobiernos locales.

---

## 📐 1. Arquitectura del Sistema

Civika está estructurada en una arquitectura de **4 Capas Desacopladas**:

```
[ Frontend: React 19 + Vite 8 + Tailwind CSS ]
                      │
   ┌──────────────────┴──────────────────┐
   ▼                                     ▼
[ Service IA: Groq Llama 3 ]     [ Microservicio Biométrico: Java Spring Boot + ONNX ]
(Categorización & Reportes)     (SCRFD 10G Detection + ArcFace 512D Embeddings)
   │                                     │
   └──────────────────┬──────────────────┘
                      ▼
    [ Base de Datos: PostgreSQL 15 Supabase RLS ]
    (21 Tablas 3FN + Row Level Security Estricto)
```

1. **Capa Presentación (Frontend)**: React 19, Vite 8, Lucide Icons y Tailwind CSS.
2. **Capa Inferencia Biométrica (Backend)**: Java 17 Spring Boot con ONNX Runtime ejecutando modelos locales de detección (`scrfd_10g_bnkps.onnx`), anti-spoofing (`minifasnetv2.onnx`) y extracción facial de 512 dimensiones (`w600k_r50.onnx`).
3. **Capa Inteligencia Artificial Generativa**: Motor Groq API con modelos Llama 3 para auto-clasificación de reportes y generación de resúmenes ejecutivos.
4. **Capa Persistencia y Seguridad**: Supabase (PostgreSQL 15) con 21 tablas en Tercera Forma Normal (3FN) y políticas RLS aisladas por rol.

---

## 📦 2. Dependencias y Requisitos Previos

- **Node.js**: v20.0.0 o superior
- **npm**: v10.0.0 o superior
- **Java JDK**: v17 (OpenJDK / Oracle JDK)
- **Maven**: 3.8+ (incluido wrapper `mvnw`)

---

## 🔑 3. Variables de Entorno (`.env.local`)

Crea o configura el archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Configuración Supabase (Persistencia y RLS)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL="postgresql://postgres.xxx:password@aws-1-us-east-1.pooler.supabase.com:5432/postgres"

# Inteligencia Artificial (Groq API)
VITE_GROQ_API_KEYS=gsk_key1,gsk_key2

# Microservicio Biométrico ONNX
VITE_BIOMETRIC_API_URL=http://localhost:8080/api/biometric
```

---

## 📂 4. Estructura Modular del Proyecto

```
Civika/
├── backend/
│   └── biometric-service/      # Microservicio Java Spring Boot ONNX
│       ├── models/             # Modelos neuronales ONNX (SCRFD, ArcFace)
│       ├── scripts/            # Script PowerShell para descarga automática
│       └── src/main/java/      # Controladores, Servicios e Inferencia
├── database/
│   └── schema.sql              # Esquema PostgreSQL 15 en 3FN con RLS
├── src/
│   ├── components/             # Componentes React (Kanban, Mapa, Cámara 2FA)
│   ├── context/                # Estados globales (AuthContext, ThemeContext)
│   ├── lib/                    # Clientes de Supabase y Groq API
│   ├── pages/                  # Vistas por rol (Ciudadano, Admin, Técnico)
│   └── services/               # Servicios de llamadas a APIs REST
├── public/                     # Recursos estáticos e imágenes
├── package.json                # Dependencias de Node.js
└── vite.config.ts              # Configuración del bundler Vite
```

---

## 🚀 5. Scripts y Ejecución en Desarrollo

### Paso 1: Clonar e instalar dependencias
```bash
git clone https://github.com/MeltyDeays/Civika.git
cd Civika
npm install
```

### Paso 2: Descargar modelos ONNX para el microservicio biométrico
```powershell
cd backend/biometric-service/scripts
.\download-models.ps1
cd ../../..
```

### Paso 3: Iniciar servicios en desarrollo
```bash
# Iniciar Frontend (Vite)
npm run dev

# Iniciar Microservicio Biométrico (Spring Boot)
cd backend/biometric-service
./mvnw spring-boot:run
```

- **Frontend Web**: `http://localhost:5173`
- **API Biometría**: `http://localhost:8080`

---

## 🔌 6. Ejemplos de Endpoints de la API

### A. Microservicio Biométrico (`POST /api/biometric/verify`)
Verifica la coincidencia de identidad entre la selfie capturada en vivo y la foto de cédula.

- **Request** (`multipart/form-data`):
  - `selfie`: Archivo de imagen (JPG/PNG)
  - `cedula`: Archivo de imagen (JPG/PNG)
- **Response** (`application/json`):
  ```json
  {
    "verified": true,
    "similarityScore": 0.914,
    "livenessPassed": true,
    "message": "Verificación biométrica exitosa"
  }
  ```

### B. Auto-Clasificación IA (`POST /api/ai/classify`)
Genera la categoría y prioridad de una incidencia cívica dada su descripción.

- **Request** (`application/json`):
  ```json
  {
    "description": "Bache de gran profundidad en avenida principal causando congestión"
  }
  ```
- **Response** (`application/json`):
  ```json
  {
    "category": "Vías y Fachadas",
    "priority": "alta",
    "confidenceScore": 0.96
  }
  ```

### C. Ingesta de Denuncias (`POST /rest/v1/denuncias` - Supabase)
Crea una denuncia cívica asociada al perfil verificado del ciudadano.

- **Headers**:
  - `Authorization: Bearer <JWT_USER_TOKEN>`
  - `apikey: <VITE_SUPABASE_ANON_KEY>`
- **Request** (`application/json`):
  ```json
  {
    "titulo": "Fuga de Agua Potable",
    "descripcion": "Tubería rota cerca del parque central",
    "categoria": "Agua y Alcantarillado",
    "ubicacion": "POINT(-86.2711 12.1364)",
    "direccion": "Sector 3, Frente a Parque Central"
  }
  ```

---

*Civika © 2026 - Desarrollado por Evertz, Bryan y Wesling.*
