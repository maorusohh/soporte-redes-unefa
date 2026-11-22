import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi, messageFor } from "../api/client.js";
import { useAuth } from "../auth/AuthProvider.jsx";
import FocusHeading from "../components/FocusHeading.jsx";
import Notice from "../components/Notice.jsx";
import SessionGate from "../components/SessionGate.jsx";

export default function ChangePasswordPage() {
  const [success, setSuccess] = useState(false);

  if (success) {
    return (
      <div className="page page--narrow">
        <section className="card">
          <p className="eyebrow">Cuenta</p>
          <FocusHeading>Contraseña actualizada</FocusHeading>
          <Notice kind="success" role="status">
            El servidor confirmó el cambio. Las sesiones anteriores deben quedar
            revocadas; vuelve a iniciar sesión con la nueva contraseña.
          </Notice>
          <p className="button-row">
            <Link className="button" to="/login?notice=password-changed">
              Ir al acceso
            </Link>
          </p>
        </section>
      </div>
    );
  }

  return (
    <SessionGate>
      {(user) => (
        <ChangePasswordForm user={user} onSuccess={() => setSuccess(true)} />
      )}
    </SessionGate>
  );
}

function ChangePasswordForm({ user, onSuccess }) {
  const auth = useAuth();
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const current = form.current_password;
    const next = form.new_password;
    const confirmation = form.confirm_password;

    if (!current || !next || !confirmation) {
      setError("Completa las tres contraseñas.");
      return;
    }

    if (next !== confirmation) {
      setError("Las dos contraseñas nuevas no coinciden.");
      setForm((value) => ({ ...value, confirm_password: "" }));
      return;
    }

    setBusy(true);
    try {
      await authApi.changePassword(current, next);
      auth.clearSession();
      onSuccess();
    } catch (requestError) {
      setError(
        messageFor(requestError, "No se pudo cambiar la contraseña.", {
          401: "Tu sesión expiró o la contraseña actual no es válida. Vuelve a iniciar sesión si el problema continúa.",
          403: "El servidor rechazó el cambio para esta cuenta.",
          422: "Revisa la contraseña actual y que la nueva cumpla la política del servidor."
        })
      );
      setForm({
        current_password: "",
        new_password: "",
        confirm_password: ""
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page page--narrow">
      <section className="card">
        <p className="eyebrow">Cuenta autenticada</p>
        <FocusHeading>Cambiar contraseña</FocusHeading>
        <p className="muted">
          Sesión de <strong>{user.email || "cuenta sin correo"}</strong>. El
          servidor revocará las sesiones anteriores después del cambio.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="current-password">Contraseña actual</label>
            <input
              id="current-password"
              name="current_password"
              type="password"
              autoComplete="current-password"
              value={form.current_password}
              onChange={updateField}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="new-password">Nueva contraseña</label>
            <input
              id="new-password"
              name="new_password"
              type="password"
              autoComplete="new-password"
              value={form.new_password}
              onChange={updateField}
              required
            />
            <p className="hint">
              La política definitiva de contraseña la valida el servidor.
            </p>
          </div>

          <div className="field">
            <label htmlFor="confirm-password">Confirmar nueva contraseña</label>
            <input
              id="confirm-password"
              name="confirm_password"
              type="password"
              autoComplete="new-password"
              value={form.confirm_password}
              onChange={updateField}
              required
            />
          </div>

          {error && (
            <Notice kind="error" role="alert">
              {error}
            </Notice>
          )}

          <p className="button-row">
            <button className="button" type="submit" disabled={busy}>
              {busy ? "Actualizando…" : "Actualizar contraseña"}
            </button>
            <Link className="button button--secondary" to="/session">
              Cancelar
            </Link>
          </p>
        </form>
      </section>
    </div>
  );
}
