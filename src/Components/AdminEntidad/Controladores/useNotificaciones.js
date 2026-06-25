import { useState, useEffect, useCallback } from "react";
import { 
  obtenerNotificaciones, 
  marcarComoLeida, 
  marcarTodasLeidas, 
  contarNoLeidas 
} from "../../../services/notificacionesService";
import { supabase } from "../../../core/supabaseClient";

export function useNotificaciones() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const cargarDatos = useCallback(async () => {
    if (!userId) return;
    const [resNotifs, resCount] = await Promise.all([
      obtenerNotificaciones(userId),
      contarNoLeidas(userId)
    ]);
    
    if (!resNotifs.error) setNotificaciones(resNotifs.data);
    if (!resCount.error) setNoLeidas(resCount.count);
  }, [userId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      cargarDatos();
    }, 0);
    const interval = setInterval(cargarDatos, 30000); // Polling 30s
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [cargarDatos]);

  const handleMarcarLeida = async (id) => {
    const { error } = await marcarComoLeida(id);
    if (!error) {
      setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
      setNoLeidas(prev => Math.max(0, prev - 1));
    }
  };

  const handleMarcarTodasLeidas = async () => {
    const { error } = await marcarTodasLeidas(userId);
    if (!error) {
      setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
      setNoLeidas(0);
    }
  };

  return {
    notificaciones,
    noLeidas,
    marcarLeida: handleMarcarLeida,
    marcarTodasLeidas: handleMarcarTodasLeidas,
    recargar: cargarDatos
  };
}
