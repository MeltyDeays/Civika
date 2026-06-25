// Archivo: src/App.jsx
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useMemo, useState, lazy, Suspense } from "react";
import DisenoAplicacion from "./Components/AppLayout";

// Importaciones dinámicas (lazy loading) para reducir tamaño de chunks y acelerar carga inicial
const VistaDashboardAdmin = lazy(() => import("./Components/AdminEntidad/Vistas/DashboardView"));
const VistaKanbanAdmin = lazy(() => import("./Components/AdminEntidad/Vistas/KanbanView"));
const VistaReportesAdmin = lazy(() => import("./Components/AdminEntidad/Vistas/ReportesView"));
const VistaMapaCalor = lazy(() => import("./Components/AdminEntidad/Vistas/MapaCalorView"));
const VistaInventarioAdmin = lazy(() => import("./Components/AdminEntidad/Vistas/InventarioView"));
const VistaEstadisticasAdmin = lazy(() => import("./Components/AdminEntidad/Vistas/EstadisticasMaterialesView"));
const VistaSolicitudesAdmin = lazy(() => import("./Components/AdminEntidad/Vistas/SolicitudesView"));
const VistaCuadrillasAdmin = lazy(() => import("./Components/AdminEntidad/Vistas/CuadrillasView"));

const VistaReportesCiudadano = lazy(() => import("./Components/Ciudadanos/Vistas/ReportesView"));
const VistaSugerencias = lazy(() => import("./Components/Ciudadanos/Vistas/SugerenciasView"));

const VistaTareasTecnico = lazy(() => import("./Components/Tecnico/Vistas/TareasView"));
const VistaRecursosTecnico = lazy(() => import("./Components/Tecnico/Vistas/RecursosView"));

const VistaSuperAdmin = lazy(() => import("./Components/SuperAdmin/Vistas/DashboardView"));

const VistaInicioSesion = lazy(() => import("./views/InicioSesionView"));
const VistaRegistro = lazy(() => import("./views/RegistroView"));
const VistaPerfil = lazy(() => import("./views/PerfilView"));

import { useAuth, AuthProvider } from "./modules/auth/controllers/useAuth.jsx";


function obtenerVistaPorRol(rolBd) {
  if (rolBd === "ciudadano") return "ciudadano";
  if (rolBd === "super_admin") return "super_admin";
  if (rolBd === "tecnico") return "tecnico";
  if (rolBd === "admin_entidad") return "admin_entidad";
  return null;
}

function rutaDefaultPorRol(rol) {
  if (rol === "ciudadano") return "/ciudadano/reportes";
  if (rol === "super_admin") return "/super/dashboard";
  if (rol === "tecnico") return "/tecnico/tareas";
  return "/admin/dashboard";
}

function RutaProtegida({ sesion, rolActual, rolesPermitidos, cargandoSesion, children }) {
  if (cargandoSesion) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando sesión...</div>;
  }
  if (!sesion) return <Navigate to="/" replace />;
  if (!rolActual) return <Navigate to="/" replace />;
  
  if (Array.isArray(rolesPermitidos) && !rolesPermitidos.includes(rolActual)) {
    return <Navigate to={rutaDefaultPorRol(rolActual)} replace />;
  }
  return children;
}

function App() {
  const { cargandoSesion, sesion, perfil, rol, login, logout, registroCiudadano, registroInstitucional, registroTecnico } = useAuth();
  const rolVista = useMemo(() => obtenerVistaPorRol(rol), [rol]);
  const [vistaAuth, setVistaAuth] = useState("login");

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            cargandoSesion ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando sesión...</div>
            ) : sesion && rolVista ? (
              <Navigate to={rutaDefaultPorRol(rolVista)} replace />
            ) : sesion && !rolVista ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: '#fee2e2', color: '#991b1b', height: '100vh' }}>
                <h3>⚠️ Error de Perfil</h3>
                <p>Tu cuenta fue creada pero el perfil falló al guardarse. Contacta soporte o cierra sesión e intenta de nuevo.</p>
                <button className="primary-btn" onClick={logout} style={{ marginTop: '1rem' }}>Cerrar Sesión</button>
              </div>
            ) : vistaAuth === "registro" ? (
              <VistaRegistro
                alRegistroCiudadano={registroCiudadano}
                alRegistroInstitucional={registroInstitucional}
                alRegistroTecnico={registroTecnico}
                alIrLogin={() => setVistaAuth("login")}
              />
            ) : (
              <VistaInicioSesion
                alIniciarSesion={login}
                cargandoSesion={cargandoSesion}
                alIrRegistro={() => setVistaAuth("registro")}
              />
            )
          }
        />

        <Route
          element={
            <RutaProtegida sesion={sesion} rolActual={rolVista} rolesPermitidos={["ciudadano", "tecnico"]} cargandoSesion={cargandoSesion}>
              <DisenoAplicacion rol="ciudadano" rolReal={rolVista} nombreUsuario={perfil?.nombre_completo} alCerrarSesion={logout} sesion={sesion} perfil={perfil} />
            </RutaProtegida>
          }
        >
          <Route path="/ciudadano/reportes" element={<VistaReportesCiudadano />} />
          <Route path="/ciudadano/sugerencias" element={<VistaSugerencias />} />
          <Route path="/ciudadano/perfil" element={<VistaPerfil />} />
        </Route>

        <Route
          element={
            <RutaProtegida sesion={sesion} rolActual={rolVista} rolesPermitidos={["tecnico"]} cargandoSesion={cargandoSesion}>
              <DisenoAplicacion rol="tecnico" rolReal={rolVista} nombreUsuario={perfil?.nombre_completo} alCerrarSesion={logout} sesion={sesion} perfil={perfil} />
            </RutaProtegida>
          }
        >
          <Route path="/tecnico/tareas" element={<VistaTareasTecnico />} />
          <Route path="/tecnico/recursos" element={<VistaRecursosTecnico />} />
        </Route>

        <Route
          element={
            <RutaProtegida sesion={sesion} rolActual={rolVista} rolesPermitidos={["admin_entidad"]} cargandoSesion={cargandoSesion}>
              <DisenoAplicacion rol="admin" nombreUsuario={perfil?.nombre_completo} alCerrarSesion={logout} sesion={sesion} perfil={perfil} />
            </RutaProtegida>
          }
        >
          <Route path="/admin/dashboard" element={<VistaDashboardAdmin />} />
          <Route path="/admin/reportes" element={<VistaReportesAdmin />} />
          <Route path="/admin/proyectos" element={<VistaKanbanAdmin />} />
          <Route path="/admin/cuadrillas" element={<VistaCuadrillasAdmin />} />
          <Route path="/admin/mapa-calor" element={<VistaMapaCalor />} />
          <Route path="/admin/inventario" element={<VistaInventarioAdmin />} />
          <Route path="/admin/solicitudes" element={<VistaSolicitudesAdmin />} />
          <Route path="/admin/estadisticas-materiales" element={<VistaEstadisticasAdmin />} />
        </Route>

        <Route
          element={
            <RutaProtegida sesion={sesion} rolActual={rolVista} rolesPermitidos={["super_admin"]} cargandoSesion={cargandoSesion}>
              <DisenoAplicacion rol="super_admin" nombreUsuario={perfil?.nombre_completo} alCerrarSesion={logout} sesion={sesion} perfil={perfil} />
            </RutaProtegida>
          }
        >
          <Route path="/super/dashboard" element={<VistaSuperAdmin />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function AppWrapper() {
  return (
    <AuthProvider>
      <Suspense fallback={
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: '#0f172a',
          color: '#94a3b8',
          fontFamily: 'sans-serif',
          fontSize: '1.25rem'
        }}>
          Cargando módulo...
        </div>
      }>
        <App />
      </Suspense>
    </AuthProvider>
  );
}