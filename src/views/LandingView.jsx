import { Link } from "react-router-dom";

export default function VistaInicio() {
  return (
    <div className="landing">
      <h1>Tu voz construye un mejor pais</h1>
      <p>
        Sprint 1 de CivicReports: reportes ciudadanos, sugerencias firmables y tablero
        operativo para agentes gubernamentales.
      </p>
      <div className="landing-actions">
        <Link className="primary-btn" to="/ciudadano/reportes">
          Entrar como Ciudadano
        </Link>
        <Link className="secondary-btn" to="/admin/reportes">
          Entrar como Administrador
        </Link>
      </div>
    </div>
  );
}
