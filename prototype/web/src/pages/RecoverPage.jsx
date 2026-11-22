import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi, messageFor } from "../api/client.js";
import FocusHeading from "../components/FocusHeading.jsx";
import Notice from "../components/Notice.jsx";

export default function RecoverPage() {
  const [forgot, setForgot] = useState({ email: "" });
  const [forgotStatus, setForgotStatus] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotBusy, setForgotBusy] = useState(false);

  const [reset, setReset] = useState({
    email: "",
    code: "",
    new_password: "",
    confirm_password: ""
  });
  const [resetError, setResetError] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  function updateForgot(event) {
    const { name, value } = event.target;
    setForgot((current) => ({ ...current, [name]: value }));
  }

  function updateReset(event) {
    const { name, value } = event.target;
    setReset((current) => ({ ...current, [name]: value }));
  }

  async function handleForgot(event) {
    event.preventDefault();
    setForgotError("");
    setForgotStatus("");

    const email = forgot.email.trim();
    if (!email) {
      setForgotError("Escribe el correo de la cuenta.");
      return;
    }

    setForgotBusy(true);
    try {
      await authApi.forgotPassword(email);
      setForgotStatus(
        "Solicitud registrada. Por seguridad, la respuesta es la misma exista o no la cuenta. Contacta al administrador autorizado para recibir un código temporal. No se envía ningún correo automático."
      );
      setReset((current) =>
        current.email ? current : { ...current, email }
      );
    } catch (error) {
      setForgotError(
        messageFor(error, "No se pudo registrar la solicitud. Inténtalo de nuevo.", {
          422: "Revisa el formato del correo electrónico.",
          429: "Demasiadas solicitudes. Espera un momento antes de volver a intentar."
        })
      );
    } finally {
      setForgotBusy(false);
    }
  }

  async function handleReset(event) {
    event.preventDefault();
    setResetError("");

    const email = reset.email.trim();
    const code = reset.code.trim();
    const password = reset.new_password;
    const confirmation = reset.confirm_password;

    if (!email || !code || !password || !confirmation) {
      setResetError("Completa el correo, el código y la nueva contraseña.");
      return;
    }

    if (password !== confirmation) {
      setResetError("Las dos contraseñas nuevas no coinciden.");
      setReset((current) => ({ ...current, confirm_password: "" }));
      return;
    }

    setResetBusy(true);
    try {
      await authApi.resetPassword(email, code, password);
      setSuccess(true);
    } catch (error) {
      const codeMessage =
        "El código no es válido, ya fue usado o expiró. Solicita uno nuevo al administrador.";
      setResetError(
        messageFor(error, "No se pudo restablecer la contraseña.", {
          400: codeMessage,
          401: codeMessage,
          403: codeMessage,
          410: codeMessage,
          422: "No se pudo restablecer. Verifica el código temporal y que la nueva contraseña cumpla la política del servidor."
        })
      );
      setReset((current) => ({
        ...current,
        new_password: "",
        confirm_password: ""
      }));
    } finally {
      setResetBusy(false);
    }
  }

  if (success) {
    return (
      <div className="page page--narrow">
        <section className="card">
          <p className="eyebrow">Recuperación supervisada</p>
          <FocusHeading>Contraseña actualizada</FocusHeading>
          <Notice kind="success" role="status">
            El servidor confirmó el cambio. Por seguridad, no se abrió una
            sesión automática.
          </Notice>
          <p className="button-row">
            <Link className="button" to="/login?notice=reset-success">
              Ir al acceso
            </Link>
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="page page--narrow">
      <section className="card">
        <p className="eyebrow">Recuperación supervisada</p>
        <h1>Olvidé mi contraseña</h1>
        <p>
          La recuperación es asistida por un administrador autorizado. El
          sistema <strong>no envía correos electrónicos</strong> ni inicia sesión
          automáticamente después del cambio.
        </p>

        <Notice kind="warning">
          Contacta al administrador por el canal acordado. Él verificará tu
          identidad fuera del sistema y te entregará un código temporal de un
          solo uso.
        </Notice>

        <form onSubmit={handleForgot}>
          <fieldset>
            <legend>Paso 1. Solicitar ayuda</legend>
            <p className="hint">
              La respuesta es genérica y no revela si el correo está registrado.
            </p>

            <div className="field">
              <label htmlFor="forgot-email">Correo electrónico</label>
              <input
                id="forgot-email"
                name="email"
                type="email"
                autoComplete="username"
                inputMode="email"
                maxLength="254"
                placeholder="usuario@example.com"
                value={forgot.email}
                onChange={updateForgot}
                required
              />
            </div>

            {forgotStatus && (
              <Notice kind="success" role="status">
                {forgotStatus}
              </Notice>
            )}
            {forgotError && (
              <Notice kind="error" role="alert">
                {forgotError}
              </Notice>
            )}

            <div className="button-row">
              <button className="button" type="submit" disabled={forgotBusy}>
                {forgotBusy ? "Solicitando…" : "Solicitar ayuda"}
              </button>
            </div>
          </fieldset>
        </form>

        <form onSubmit={handleReset}>
          <fieldset>
            <legend>Paso 2. Usar el código temporal</legend>
            <p className="hint">
              Introduce el código cuando el administrador te lo entregue. No se
              envía por correo desde esta aplicación.
            </p>

            <div className="field">
              <label htmlFor="reset-email">Correo electrónico</label>
              <input
                id="reset-email"
                name="email"
                type="email"
                autoComplete="username"
                inputMode="email"
                maxLength="254"
                placeholder="usuario@example.com"
                value={reset.email}
                onChange={updateReset}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="reset-code">Código temporal</label>
              <input
                id="reset-code"
                name="code"
                type="text"
                autoComplete="one-time-code"
                autoCapitalize="none"
                spellCheck="false"
                maxLength="128"
                value={reset.code}
                onChange={updateReset}
                required
              />
              <p className="hint">
                Código de un solo uso. No lo compartas ni lo guardes en el
                repositorio.
              </p>
            </div>

            <div className="field">
              <label htmlFor="new-password">Nueva contraseña</label>
              <input
                id="new-password"
                name="new_password"
                type="password"
                autoComplete="new-password"
                value={reset.new_password}
                onChange={updateReset}
                required
              />
              <p className="hint">
                La política definitiva de contraseña la valida el servidor.
              </p>
            </div>

            <div className="field">
              <label htmlFor="confirm-password">
                Confirmar nueva contraseña
              </label>
              <input
                id="confirm-password"
                name="confirm_password"
                type="password"
                autoComplete="new-password"
                value={reset.confirm_password}
                onChange={updateReset}
                required
              />
            </div>

            {resetError && (
              <Notice kind="error" role="alert">
                {resetError}
              </Notice>
            )}

            <div className="button-row">
              <button className="button" type="submit" disabled={resetBusy}>
                {resetBusy ? "Guardando…" : "Guardar nueva contraseña"}
              </button>
            </div>
          </fieldset>
        </form>

        <p className="helper">
          <Link to="/login">Volver al acceso</Link>
        </p>
      </section>
    </div>
  );
}
