# Civika

Plataforma web para reportes ciudadanos, gestión municipal y verificación biométrica de identidad.

---

## Requisitos previos

- **Node.js**: v20+
- **npm**: v10+
- **Java JDK**: 17 (para el microservicio biométrico)

---

## Pasos para ejecutar la aplicación

### 1. Clonar e instalar dependencias
```bash
git clone https://github.com/MeltyDeays/Civika.git
cd Civika
npm install
```

### 2. Variables de entorno (`.env.local`)
Crea o edita `.env.local` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
DATABASE_URL="postgresql://postgres.xxx:password@aws-1-us-east-1.pooler.supabase.com:5432/postgres"

VITE_GROQ_API_KEYS=tu_groq_key_1,tu_groq_key_2
VITE_BIOMETRIC_API_URL=/api/biometric
```

### 3. Descargar modelos biométricos (ONNX)
```powershell
cd backend/biometric-service/scripts
.\download-models.ps1
cd ../../..
```

### 4. Iniciar la aplicación
```bash
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend biométrico**: http://localhost:8080
