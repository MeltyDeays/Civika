import { useEffect, useMemo, useState, createContext, useContext, useRef } from "react";
import { supabase } from "../../../core/supabaseClient";
import { signInWithEmail, registroCiudadano as registroCiudadanoModel, registroInstitucional as registroInstitucionalModel, registroTecnico as registroTecnicoModel, vincularCodigoTecnico as vincularCodigoTecnicoModel } from "../models/authModel";
import { fetchProfileByUserId, updateProfile, desactivarCuenta as desactivarCuentaModel } from "../models/profileModel";
import PantallaBloqueo from "../components/PantallaBloqueo";

function mapRolToAppRole(rolBd) {
  if (rolBd === "ciudadano") return "ciudadano";
  if (rolBd === "super_admin") return "super_admin";
  if (rolBd === "admin_entidad") return "admin_entidad";
  if (rolBd === "tecnico") return "tecnico";
  return null;
}

function getStoredProfile() {
  try {
    const saved = localStorage.getItem("civic_profile");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function setStoredProfile(perfil) {
  try {
    if (perfil) {
      localStorage.setItem("civic_profile", JSON.stringify(perfil));
    } else {
      localStorage.removeItem("civic_profile");
    }
  } catch (err) {
    console.error("Error al guardar perfil en localStorage:", err);
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [sesion, setSesion] = useState(null);
  const [perfil, setPerfil] = useState(() => getStoredProfile());
  const [bloqueoData, setBloqueoData] = useState(null);

  const perfilRef = useRef(perfil);
  useEffect(() => {
    perfilRef.current = perfil;
  }, [perfil]);

  const cargarBloqueoData = async (userId) => {
    try {
      const { data: multas } = await supabase
        .from("multas_ciudadano")
        .select(`
          id,
          nivel,
          monto,
          creado_el,
          entidad:entidades_admin(nombre, direccion)
        `)
        .eq("id_ciudadano", userId)
        .eq("estado", "pendiente")
        .order("creado_el", { ascending: false })
        .limit(1);

      const { data: strikes } = await supabase
        .from("strikes_ciudadano")
        .select(`
          id,
          motivo,
          pruebas_entidad,
          creado_el,
          denuncia:denuncias(titulo, descripcion),
          entidad:entidades_admin(nombre)
        `)
        .eq("id_ciudadano", userId)
        .eq("estado", "confirmado")
        .order("creado_el", { ascending: false })
        .limit(1);

      setBloqueoData({
        multa: multas?.[0] || null,
        strike: strikes?.[0] || null
      });
    } catch (err) {
      console.error("Error al cargar datos de bloqueo:", err);
    }
  };

  useEffect(() => {
    let activo = true;

    async function inicializar() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!activo) return;
        if (error) throw error;

        setSesion(session);
        if (session?.user?.id) {
          let perfilActual = await fetchProfileByUserId(session.user.id).catch((e) => {
            console.error("Error al obtener perfil:", e);
            return null;
          });
          
          if (!perfilActual && activo) {
             // Pequeño reintento por si la BD tarda en crear el perfil tras el registro
             await new Promise(r => setTimeout(r, 1000));
             perfilActual = await fetchProfileByUserId(session.user.id).catch(() => null);
          }
          
          if (activo) {
            setPerfil(perfilActual);
            setStoredProfile(perfilActual);
            if (perfilActual) {
              if (perfilActual.estado_cuenta === 'suspendido' || perfilActual.estado_cuenta === 'baneado') {
                await cargarBloqueoData(session.user.id);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error al inicializar sesión:", err);
      } finally {
        if (activo) setCargandoSesion(false);
      }
    }

    inicializar();

    const { data } = supabase.auth.onAuthStateChange(async (evento, nuevaSesion) => {
      // Ignoramos INITIAL_SESSION para que no colisione con getSession() (evita deadlocks)
      if (evento === 'INITIAL_SESSION') return;
      
      // Si el token se refresca, no necesitamos reiniciar todo el estado, solo actualizar la sesión
      if (evento === 'TOKEN_REFRESHED') {
        if (activo) setSesion(nuevaSesion);
        return;
      }

      if (!activo) return;
      
      // Solo actualizamos si realmente hubo un cambio significativo o cierre de sesión
      if (!nuevaSesion) {
        setSesion(null);
        setPerfil(null);
        setStoredProfile(null);
        setCargandoSesion(false);
        return;
      }

      setSesion(nuevaSesion);
      if (nuevaSesion?.user?.id) {
        try {
          // Si ya tenemos el perfil y el ID coincide, no lo volvemos a cargar (evita parpadeos y "vaciado")
          if (perfilRef.current && perfilRef.current.id === nuevaSesion.user.id) {
            setCargandoSesion(false);
            return;
          }

          const perfilActual = await fetchProfileByUserId(nuevaSesion.user.id).catch(() => null);
          if (activo) {
            setPerfil(perfilActual);
            setStoredProfile(perfilActual);
            if (perfilActual) {
              if (perfilActual.estado_cuenta === 'suspendido' || perfilActual.estado_cuenta === 'baneado') {
                await cargarBloqueoData(nuevaSesion.user.id);
              }
            }
            setCargandoSesion(false);
          }
        } catch {
          if (activo) {
            setPerfil(null);
            setStoredProfile(null);
            setCargandoSesion(false);
          }
        }
      }
    });

    const safetyFallback = setTimeout(() => {
      if (activo) setCargandoSesion(false);
    }, 3000);

    return () => {
      activo = false;
      clearTimeout(safetyFallback);
      data.subscription.unsubscribe();
    };
  }, []);

  const rol = useMemo(() => {
    if (sesion?.user?.email === "everdavicloez123@gmail.com") return "super_admin";
    if (sesion?.user?.email === "ciudadano@test.com") return "admin_entidad";
    return mapRolToAppRole(perfil?.rol);
  }, [perfil, sesion]);

  const actions = useMemo(() => {
    return {
      async login(email, password) {
        const respuesta = await signInWithEmail(email, password);
        const sesionNueva = respuesta.session;
        setSesion(sesionNueva);
        if (sesionNueva?.user?.id) {
          try {
            let perfilActual = await fetchProfileByUserId(sesionNueva.user.id);
            
            if (!perfilActual) {
              console.warn("Perfil no visible por RLS, construyendo desde JWT metadata...");
              const meta = sesionNueva.user.user_metadata || {};
              perfilActual = {
                id: sesionNueva.user.id,
                nombre_completo: meta.nombre_completo || sesionNueva.user.email.split('@')[0],
                cedula: meta.cedula || "",
                rol: meta.rol || "ciudadano",
                id_entidad: meta.id_entidad || null,
                especialidad: meta.especialidad || "general",
                activo: true,
                estado_cuenta: "activo",
                creado_el: new Date().toISOString()
              };
            }
            
            setPerfil(perfilActual);
            setStoredProfile(perfilActual);
            if (perfilActual) {
              if (perfilActual.estado_cuenta === 'suspendido' || perfilActual.estado_cuenta === 'baneado') {
                await cargarBloqueoData(sesionNueva.user.id);
              }
            }
          } catch (err) {
            console.error("Error en login/perfil:", err);
            setPerfil(null);
          }
        }
      },
      async logout() {
        try {
          localStorage.clear();
          sessionStorage.clear();
          setSesion(null);
          setPerfil(null);
          supabase.auth.signOut().catch(() => {});
          window.location.href = "/";
        } catch {
          localStorage.clear();
          window.location.href = "/";
        }
      },
      async registroCiudadano(payload) {
        return await registroCiudadanoModel(payload);
      },
      async registroInstitucional(payload) {
        return await registroInstitucionalModel(payload);
      },
      async registroTecnico(payload) {
        return await registroTecnicoModel(payload);
      },
      async vincularCodigoTecnico(codigo) {
        if (!sesion?.user?.id) throw new Error("Debes iniciar sesión primero.");
        return await vincularCodigoTecnicoModel(sesion.user.id, codigo);
      },
      async actualizarPerfil(campos) {
        if (!sesion?.user?.id) throw new Error("Debes iniciar sesión primero.");
        const perfilActualizado = await updateProfile(sesion.user.id, campos);
        setPerfil(perfilActualizado);
        setStoredProfile(perfilActualizado);
        return perfilActualizado;
      },
      async solicitarBaja() {
        if (!sesion?.user?.id) throw new Error("Debes iniciar sesión primero.");
        await desactivarCuentaModel(sesion.user.id);
      },
    };
  }, [sesion]);

  const value = useMemo(() => ({
    cargandoSesion, sesion, perfil, rol, ...actions
  }), [cargandoSesion, sesion, perfil, rol, actions]);

  const estaBloqueado = perfil && (perfil.estado_cuenta === 'suspendido' || perfil.estado_cuenta === 'baneado');

  return (
    <AuthContext.Provider value={value}>
      {estaBloqueado ? (
        <PantallaBloqueo
          perfil={perfil}
          bloqueoData={bloqueoData}
          alCerrarSesion={actions.logout}
        />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}

