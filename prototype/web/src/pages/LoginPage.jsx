import { useState } from "react";
import {
  Link,
  Navigate,
  useNavigate,
  useSearchParams
} from "react-router-dom";
import { messageFor } from "../api/client.js";
import { useAuth } from "../auth/AuthProvider.jsx";
import Notice from "../components/Notice.jsx";

const notices = {
  "session-expired": "Tu sesión expiró. Vuelve a iniciar sesión.",
  "session-required": "Necesitas iniciar sesión para ver esa pantalla.",
  "logged-out": "La sesión se cerró correctamente.",
  "password-changed": "La contraseña se actualizó. Inicia sesión de nuevo.",
  "reset-success":
    "La contraseña se restableció. Inicia sesión con la nueva contraseña."
};

export default function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (auth.status === "authenticated") {
    return <Navigate to="/session" replace />;
  }

  const notice = notices[searchParams.get("notice")];

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const email = form.email.trim();
    const password = form.password;

    if (!email || !password) {
      setError("Completa el correo y la contraseña.");
      return;
    }

    setBusy(true);
    try {
      await auth.login(email, password);
      navigate("/session", { replace: true });
    } catch (requestError) {
      setError(
        messageFor(requestError, "No se pudo iniciar sesión. Inténtalo de nuevo.", {
          401: "Correo o contraseña incorrectos. Revisa tus datos o contacta al administrador.",
          403: "No se pudo iniciar sesión con esta cuenta. Contacta al administrador si el problema continúa.",
          422: "Revisa el formato del correo y completa la contraseña."
        })
      );
      setForm((current) => ({ ...current, password: "" }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <section className="card" aria-labelledby="login-title">
        <p className="eyebrow">Autenticación P0</p>
        <h1 id="login-title">Iniciar sesión</h1>
        <p className="muted">
          Accede con una cuenta autorizada por el administrador. No existe
          registro público libre.
        </p>

        {auth.status === "loading" && (
          <Notice kind="info" role="status">
            Verificando si ya existe una sesión…
          </Notice>
        )}

        {auth.status === "error" && (
          <Notice kind="warning" role="status">
            No se pudo verificar la sesión existente:{" "}
            {messageFor(auth.error, "error de conexión.")}
          </Notice>
        )}

        {notice && (
          <Notice kind="info" role="status">
            {notice}
          </Notice>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              inputMode="email"
              maxLength="254"
              placeholder="usuario@example.com"
              value={form.email}
              onChange={updateField}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={updateField}
              required
            />
          </div>

          {error && (
            <Notice kind="error" role="alert">
              {error}
            </Notice>
          )}

          <div className="button-row">
            <button className="button" type="submit" disabled={busy}>
              {busy ? "Entrando…" : "Entrar"}
            </button>
          </div>
        </form>

        <p className="helper">
          <Link to="/recover">¿Olvidaste tu contraseña?</Link>
        </p>
      </section>

      <aside className="card" aria-labelledby="login-status-title">
        <h2 id="login-status-title">Estado de esta entrega</h2>
        <p>
          Estas vistas usan React + Vite y el contrato HTTP/JSON de{" "}
          <code>/api/v1</code> del documento 10. No hay usuarios ni contraseñas
          escritos en el código.
        </p>
        <p>
          El inicio de sesión real depende de los endpoints de AUTH-001.
          Mientras no estén disponibles, la pantalla mostrará un error de
          conexión o de ruta, no un acceso simulado.
        </p>
        <ul className="list-plain">
          <li>La sesión se apoya en una cookie HttpOnly administrada por el navegador.</li>
          <li>No se guardan credenciales ni tokens en <code>localStorage</code>.</li>
          <li>Los permisos definitivos se aplican en Backend, no solo ocultando botones.</li>
        </ul>
      </aside>
    </div>
  );
}
