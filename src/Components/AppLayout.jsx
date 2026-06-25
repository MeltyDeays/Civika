import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { supabase } from "../core/supabaseClient";
import ChatbotWidget from "./ui/ChatbotWidget";

const enlacesAdmin = [
  { to: "/admin/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/admin/reportes", label: "Reportes", icon: "📄" },
  { to: "/admin/proyectos", label: "Proyectos", icon: "📋" },
  { to: "/admin/mapa-calor", label: "Mapa de Calor", icon: "🗺️" },
  { to: "/admin/cuadrillas", label: "Personal", icon: "👥" },
  { to: "/admin/inventario", label: "Inventario", icon: "📦" },
  { to: "/admin/solicitudes", label: "Solicitudes", icon: "📩" },
  { to: "/admin/estadisticas-materiales", label: "Estadísticas", icon: "📈" },
];

const enlacesSuperAdmin = [{ to: "/super/dashboard", label: "Dashboard", icon: "📊" }];

const IsotipoLogo = ({ color = "var(--primary)" }) => (
  <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
    <circle cx="50" cy="50" r="44" stroke="var(--accent-gold)" strokeWidth="2.5" strokeDasharray="3 3" opacity="0.5"/>
    <line x1="30" y1="30" x2="50" y2="18" stroke={color} strokeWidth="2" opacity="0.7"/>
    <line x1="50" y1="18" x2="70" y2="30" stroke={color} strokeWidth="2" opacity="0.7"/>
    <line x1="70" y1="30" x2="82" y2="50" stroke={color} strokeWidth="2" opacity="0.7"/>
    <line x1="82" y1="50" x2="70" y2="70" stroke={color} strokeWidth="2" opacity="0.7"/>
    <line x1="70" y1="70" x2="50" y2="82" stroke={color} strokeWidth="2" opacity="0.7"/>
    <line x1="50" y1="82" x2="30" y2="70" stroke={color} strokeWidth="2" opacity="0.7"/>
    <line x1="30" y1="70" x2="18" y2="50" stroke={color} strokeWidth="2" opacity="0.7"/>
    <line x1="18" y1="50" x2="30" y2="30" stroke={color} strokeWidth="2" opacity="0.7"/>
    <line x1="30" y1="30" x2="50" y2="50" stroke="var(--accent-gold)" strokeWidth="2" opacity="0.8"/>
    <line x1="50" y1="18" x2="50" y2="50" stroke="var(--accent-gold)" strokeWidth="2" opacity="0.8"/>
    <line x1="70" y1="30" x2="50" y2="50" stroke="var(--accent-gold)" strokeWidth="2" opacity="0.8"/>
    <line x1="82" y1="50" x2="50" y2="50" stroke="var(--accent-gold)" strokeWidth="2" opacity="0.8"/>
    <line x1="70" y1="70" x2="50" y2="50" stroke="var(--accent-gold)" strokeWidth="2" opacity="0.8"/>
    <line x1="50" y1="82" x2="50" y2="50" stroke="var(--accent-gold)" strokeWidth="2" opacity="0.8"/>
    <line x1="30" y1="70" x2="50" y2="50" stroke="var(--accent-gold)" strokeWidth="2" opacity="0.8"/>
    <line x1="18" y1="50" x2="50" y2="50" stroke="var(--accent-gold)" strokeWidth="2" opacity="0.8"/>
    <circle cx="50" cy="50" r="5" fill={color}/>
    <circle cx="30" cy="30" r="4" fill="var(--accent-gold)"/>
    <circle cx="50" cy="18" r="4" fill={color}/>
    <circle cx="70" cy="30" r="4" fill="var(--accent-gold)"/>
    <circle cx="82" cy="50" r="4" fill={color}/>
    <circle cx="70" cy="70" r="4" fill="var(--accent-gold)"/>
    <circle cx="50" cy="82" r="4" fill={color}/>
    <circle cx="30" cy="70" r="4" fill="var(--accent-gold)"/>
    <circle cx="18" cy="50" r="4" fill={color}/>
  </svg>
);

export default function DisenoAplicacion({ rol, rolReal, nombreUsuario, alCerrarSesion, perfil }) {
  const [cerrando, setCerrando] = useState(false);
  const [esEncargado, setEsEncargado] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const esCiudadano = rol === "ciudadano";
  const esSuperAdmin = rol === "super_admin";
  const esTecnico = rol === "tecnico";

  // Cerrar sidebar al cambiar de ruta en móviles
  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      setIsSidebarOpen(false);
    });
    return () => cancelAnimationFrame(handle);
  }, [location.pathname]);

  // Verificar si el técnico es encargado de alguna cuadrilla
  useEffect(() => {
    if (esTecnico && perfil?.id) {
      const verificarCargo = async () => {
        try {
          const { data } = await supabase
            .from("cuadrilla_obra")
            .select("id")
            .eq("id_tecnico_encargado", perfil.id)
            .limit(1);
          setEsEncargado((data?.length || 0) > 0);
        } catch {
          setEsEncargado(true);
        }
      };
      verificarCargo();
    }
  }, [esTecnico, perfil?.id]);

  const enlacesTecnico = [
    { to: "/tecnico/tareas", label: "Mis Tareas", icon: "🔧" },
    ...(esEncargado ? [{ to: "/tecnico/recursos", label: "Recursos", icon: "📦" }] : []),
  ];

  const enlaces = esTecnico
    ? enlacesTecnico
    : esSuperAdmin
      ? enlacesSuperAdmin
      : enlacesAdmin;

  const etiquetaRol = esCiudadano
    ? "Ciudadano"
    : esTecnico
      ? "Técnico"
      : esSuperAdmin
        ? "Super Admin"
        : "Panel Administrativo";

  const manejarCerrarSesion = async () => {
    setCerrando(true);
    try {
      await alCerrarSesion();
    } catch {
      setCerrando(false);
    }
  };

  return (
    <div className={`app-shell ${esCiudadano ? "app-shell-citizen" : ""}`}>
      
      {/* Overlay para cerrar Sidebar en móviles al hacer click fuera */}
      {!esCiudadano && (
        <div 
          className={`sidebar-overlay ${isSidebarOpen ? "active" : ""}`} 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* Cabecera Móvil para Roles de Gestión / Administración */}
      {!esCiudadano && (
        <header className="mobile-admin-header">
          <button className="hamburguesa-btn" onClick={() => setIsSidebarOpen(true)}>
            ☰
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <IsotipoLogo />
            <span style={{ fontSize: "16px", fontWeight: "800", color: "var(--primary)" }}>CivicReports</span>
          </div>
          <div className="role-badge-mini">{etiquetaRol}</div>
        </header>
      )}

      {/* Sidebar Principal (Admin/SuperAdmin/Tecnico) */}
      {!esCiudadano && (
        <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
          {/* Branding */}
          <div className="brand" style={{ padding: "1.25rem 0.5rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <IsotipoLogo color="#fff" />
            <div>
              <div style={{ fontSize: "16px", fontWeight: "800", letterSpacing: "-0.02em", color: "#fff" }}>CivicReports</div>
              <div className="role-tag">{etiquetaRol}</div>
            </div>
          </div>

          {/* User Card */}
          <div style={{
            margin: "1.25rem 0.25rem",
            padding: "0.85rem 1rem",
            background: "var(--primary-glow)",
            borderRadius: "var(--radius-md)",
            border: "1px solid rgba(122, 24, 53, 0.3)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "34px",
                height: "34px",
                borderRadius: "var(--radius-sm)",
                background: "var(--accent-gold)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
                fontWeight: "800",
                color: "var(--dark-bg)"
              }}>
                {(nombreUsuario || "AG").substring(0, 2).toUpperCase()}
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {nombreUsuario || "Agente Gubernamental"}
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "500" }}>
                  Nicaragua
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="nav-links">
            {enlaces.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                <span style={{ fontSize: "16px", width: "20px", textAlign: "center" }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Técnico: modo ciudadano */}
          {rolReal === "tecnico" && (
            <div style={{ padding: "0 4px", marginTop: "1rem" }}>
              <NavLink
                to="/ciudadano/reportes"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "0.85rem 1rem",
                  borderRadius: "var(--radius-md)",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: "700",
                  color: "var(--accent-gold)",
                  background: "rgba(194, 159, 104, 0.08)",
                  border: "1px solid rgba(194, 159, 104, 0.15)"
                }}
              >
                🔄 Ir a Modo Ciudadano
              </NavLink>
            </div>
          )}

          {/* Logout button */}
          <button
            onClick={manejarCerrarSesion}
            disabled={cerrando}
            className="sidebar-logout"
            style={{ margin: "auto 0 0.5rem" }}
          >
            <span>↩</span> {cerrando ? "Saliendo..." : "Salir"}
          </button>
        </aside>
      )}

      {/* Armazón para el contenido (Con cabecera o bottom-nav para ciudadano) */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        
        {/* Cabecera Desktop Ciudadano */}
        {esCiudadano && (
          <header className="citizen-desktop-header">
            <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <IsotipoLogo />
                <h2 style={{ margin: 0, color: "var(--primary)", fontWeight: "900", fontSize: "1.4rem" }}>CivicReports</h2>
              </div>
              <nav style={{ display: "flex", gap: "6px" }}>
                <NavLink 
                  to="/ciudadano/reportes" 
                  className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                  style={{ padding: "8px 20px" }}
                >
                  📊 Reportes
                </NavLink>
                <NavLink 
                  to="/ciudadano/sugerencias" 
                  className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                  style={{ padding: "8px 20px" }}
                >
                  💡 Sugerencias
                </NavLink>
                <NavLink 
                  to="/ciudadano/perfil" 
                  className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                  style={{ padding: "8px 20px" }}
                >
                  👤 Mi Perfil
                </NavLink>
              </nav>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: "800", color: "var(--text-primary)", fontSize: "0.9rem" }}>{nombreUsuario}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "600" }}>Ciudadano Activo</div>
              </div>
              
              {rolReal === "tecnico" && (
                <NavLink 
                  to="/tecnico/tareas" 
                  style={{ 
                    padding: "8px 16px", 
                    borderRadius: "var(--radius-sm)", 
                    background: "var(--primary-light)", 
                    color: "var(--primary)", 
                    textDecoration: "none", 
                    fontSize: "0.85rem", 
                    fontWeight: "700", 
                    border: "1px solid rgba(122, 24, 53, 0.15)" 
                  }}
                >
                  🛠️ Modo Técnico
                </NavLink>
              )}

              <button 
                onClick={manejarCerrarSesion} 
                style={{ 
                  background: "#fee4e2", 
                  color: "#d92d20", 
                  border: "none", 
                  padding: "10px 14px", 
                  borderRadius: "var(--radius-sm)", 
                  cursor: "pointer", 
                  fontWeight: "800" 
                }}
              >
                🚪 Cerrar Sesión
              </button>
            </div>
          </header>
        )}

        {/* Cabecera Móvil Ciudadano */}
        {esCiudadano && (
          <header className="citizen-mobile-header">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <IsotipoLogo />
              <h2 className="citizen-mobile-brand">CivicReports</h2>
            </div>
            <div className="citizen-mobile-user">
              <span>{nombreUsuario?.split(" ")[0]}</span>
              <button 
                onClick={manejarCerrarSesion} 
                style={{ 
                  background: "none", 
                  border: "none", 
                  fontSize: "1.25rem", 
                  cursor: "pointer", 
                  padding: "4px" 
                }}
              >
                🚪
              </button>
            </div>
          </header>
        )}

        {/* Contenido Principal */}
        <main className="content" style={{ flex: 1, overflowY: "auto", padding: esCiudadano ? "1.5rem" : "0" }}>
          <Outlet />
        </main>

        {/* Bottom Navigation Bar Ciudadano (Sóvil/Mobile) */}
        {esCiudadano && (
          <nav className="bottom-nav">
            <NavLink 
              to="/ciudadano/reportes" 
              className={({ isActive }) => `bottom-nav-link ${isActive ? "active" : ""}`}
            >
              <span className="bottom-nav-icon">📊</span>
              <span>Reportes</span>
            </NavLink>
            <NavLink 
              to="/ciudadano/sugerencias" 
              className={({ isActive }) => `bottom-nav-link ${isActive ? "active" : ""}`}
            >
              <span className="bottom-nav-icon">💡</span>
              <span>Sugerencias</span>
            </NavLink>
            <NavLink 
              to="/ciudadano/perfil" 
              className={({ isActive }) => `bottom-nav-link ${isActive ? "active" : ""}`}
            >
              <span className="bottom-nav-icon">👤</span>
              <span>Mi Perfil</span>
            </NavLink>
          </nav>
        )}

        {/* 🤖 Widget Flotante del Chatbot de IA: CivicReport's Bot */}
        {rol === "admin" && <ChatbotWidget entidadId={perfil?.id_entidad} />}
      </div>
    </div>
  );
}
