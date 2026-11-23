import { Link } from "react-router-dom";
import { messageFor } from "../api/client.js";
import { useAuth } from "../auth/AuthProvider.jsx";
import FocusHeading from "./FocusHeading.jsx";
import Notice from "./Notice.jsx";

export default function SessionGate({ children }) {
  const auth = useAuth();

  if (auth.status === "loading") {
    return (
      <div className="page page--narrow">
        <section className="card" aria-live="polite">
          <p className="eyebrow">Sesión</p>
          <h1>Verificando sesión…</h1>
          <p className="muted">Consultando GET /api/v1/auth/me.</p>
        </section>
      </div>
    );
  }

  if (auth.status === "anonymous") {
    return (
      <div className="page page--narrow">
        <section className="card">
          <p className="eyebrow">Sesión</p>
          <FocusHeading>No hay una sesión activa</FocusHeading>
          <p>
            Esta pantalla solo muestra datos cuando el servidor confirma una
            sesión válida. No se simula un usuario.
          </p>
          <p className="button-row">
            <Link className="button" to="/login?notice=session-required">
              Ir al acceso
            </Link>
          </p>
        </section>
      </div>
    );
  }

  if (auth.status === "error") {
    return (
      <div className="page page--narrow">
        <section className="card">
          <p className="eyebrow">Sesión</p>
          <FocusHeading>No se pudo verificar la sesión</FocusHeading>
          <Notice kind="error" role="alert">
            {messageFor(auth.error, "No se pudo consultar la sesión.")}
          </Notice>
          <p className="button-row">
            <button className="button" type="button" onClick={auth.refresh}>
              Reintentar
            </button>
            <Link className="button button--secondary" to="/login">
              Volver al acceso
            </Link>
          </p>
        </section>
      </div>
    );
  }

  return children(auth.user);
}
