import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, authApi, messageFor } from "../api/client.js";
import { useAuth } from "../auth/AuthProvider.jsx";
import FocusHeading from "../components/FocusHeading.jsx";
import Notice from "../components/Notice.jsx";
import SessionGate from "../components/SessionGate.jsx";
import { normalizeUser, normalizeUserList, USER_ROLES } from "../utils/session.js";
import { roleDescription, roleLabel } from "../utils/roles.js";

export default function SessionPage() {
  return (
    <SessionGate>
      {(user) => <SessionContent user={user} />}
    </SessionGate>
  );
}

function loadErrorText(error, fallback) {
  return messageFor(error, fallback, {
    401: "La sesión expiró. Vuelve a iniciar sesión.",
    403: "El servidor rechazó la operación con 403: esta cuenta no tiene permisos de ADMIN."
  });
}

function SessionContent({ user }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState("");
  const [logoutBusy, setLogoutBusy] = useState(false);

  const [adminUsers, setAdminUsers] = useState(null);
  const [adminError, setAdminError] = useState("");
  const [adminStatus, setAdminStatus] = useState("");
  const [adminBusy, setAdminBusy] = useState(false);

  const [newUser, setNewUser] = useState({ email: "", role: "USER" });
  const [createError, setCreateError] = useState("");
  const [createStatus, setCreateStatus] = useState("");
  const [createBusy, setCreateBusy] = useState(false);

  const [resetResult, setResetResult] = useState(null);
  const [resetError, setResetError] = useState("");
  const [resetBusyId, setResetBusyId] = useState("");

  async function handleLogout() {
    setLogoutError("");
    setLogoutBusy(true);

    try {
      await auth.logout();
      navigate("/login?notice=logged-out", { replace: true });
    } catch (error) {
      if (error?.status === 401) {
        auth.clearSession();
        navigate("/login?notice=session-expired", { replace: true });
        return;
      }
      setLogoutError(
        messageFor(error, "No se pudo cerrar la sesión. Inténtalo de nuevo.")
      );
    } finally {
      setLogoutBusy(false);
    }
  }

  async function loadAdminUsers() {
    setAdminError("");
    setAdminStatus("");
    setAdminUsers(null);
    setAdminBusy(true);

    try {
      const data = await authApi.listUsers();
      const users = normalizeUserList(data?.users, "/admin/users");
      setAdminStatus(
        "Consulta completada. El servidor confirmó el acceso de ADMIN."
      );
      setAdminUsers(users);
    } catch (error) {
      if (error?.status === 401) {
        auth.clearSession();
      }
      setAdminError(loadErrorText(error, "No se pudo consultar la lista de usuarios."));
    } finally {
      setAdminBusy(false);
    }
  }

  function updateNewUser(event) {
    const { name, value } = event.target;
    setNewUser((current) => ({ ...current, [name]: value }));
  }

  async function handleCreateUser(event) {
    event.preventDefault();
    setCreateError("");
    setCreateStatus("");
    setResetError("");
    setResetResult(null);

    const email = newUser.email.trim();
    if (!email) {
      setCreateError("Escribe el correo de la cuenta autorizada.");
      return;
    }
    if (!USER_ROLES.includes(newUser.role)) {
      setCreateError("Selecciona un rol válido: ADMIN o USER.");
      return;
    }

    setCreateBusy(true);
    try {
      const data = await authApi.createUser(email, newUser.role);
      const created = normalizeUser(data?.user, "/admin/users");

      setCreateStatus(
        `Cuenta creada: ${created.email} (${roleLabel(created.role)}). La contraseña inicial se define por activación o código temporal; no se muestra aquí.`
      );
      setNewUser({ email: "", role: "USER" });
      setAdminUsers((current) => {
        if (!current) {
          return current;
        }
        return [created, ...current.filter((item) => item.id !== created.id)];
      });
    } catch (error) {
      if (error?.status === 401) {
        auth.clearSession();
      }
      setCreateError(
        messageFor(error, "No se pudo crear la cuenta.", {
          401: "La sesión expiró. Vuelve a iniciar sesión.",
          403: "El servidor rechazó la creación con 403: esta cuenta no tiene permisos de ADMIN.",
          409: "Ya existe una cuenta con ese correo.",
          422: "Revisa el correo y el rol; el servidor validó los datos."
        })
      );
    } finally {
      setCreateBusy(false);
    }
  }

  async function handleIssueReset(targetUser) {
    setResetError("");
    setResetResult(null);

    if (!targetUser?.id) {
      setResetError("La cuenta seleccionada no tiene un identificador válido.");
      return;
    }

    setResetBusyId(targetUser.id);
    try {
      const data = await authApi.requestPasswordReset(targetUser.id);
      const code = typeof data?.code === "string" ? data.code.trim() : "";
      if (!code) {
        throw new ApiError(
          500,
          "Respuesta inesperada de /admin/password-resets"
        );
      }
      setResetResult({
        email: targetUser.email,
        code,
        expiresAt:
          typeof data?.expires_at === "string" ? data.expires_at : ""
      });
    } catch (error) {
      if (error?.status === 401) {
        auth.clearSession();
      }
      setResetError(
        messageFor(error, "No se pudo emitir el código temporal.", {
          401: "La sesión expiró. Vuelve a iniciar sesión.",
          403: "El servidor rechazó la emisión con 403: esta cuenta no tiene permisos de ADMIN.",
          404: "La cuenta seleccionada ya no existe en el servidor.",
          422: "Revisa la cuenta seleccionada; el servidor validó la solicitud."
        })
      );
    } finally {
      setResetBusyId("");
    }
  }

  return (
    <div className="page page--narrow">
      <section className="card" aria-labelledby="session-title">
        <p className="eyebrow">Sesión activa</p>
        <FocusHeading id="session-title">Tu sesión</FocusHeading>
        <p className="muted">
          Datos devueltos por el servidor para la cookie de sesión actual.
        </p>

        <dl className="session-data">
          <dt>Correo</dt>
          <dd>{user.email || "—"}</dd>
          <dt>Rol</dt>
          <dd>
            <span
              className={`badge${
                user.role === "ADMIN" ? " badge--admin" : ""
              }`}
            >
              {roleLabel(user.role)}
            </span>
          </dd>
        </dl>

        <p className="hint">{roleDescription(user.role)}</p>

        <div className="button-row">
          <Link className="button button--secondary" to="/change-password">
            Cambiar contraseña
          </Link>
          <button
            className="button button--danger"
            type="button"
            onClick={handleLogout}
            disabled={logoutBusy}
          >
            {logoutBusy ? "Cerrando…" : "Cerrar sesión"}
          </button>
        </div>

        {logoutError && (
          <Notice kind="error" role="alert">
            {logoutError}
          </Notice>
        )}
      </section>

      {user.role === "ADMIN" && (
        <section className="card" aria-labelledby="admin-users-title">
          <p className="eyebrow">Solo ADMIN</p>
          <h2 id="admin-users-title">Administración de cuentas</h2>
          <p className="muted">
            Estas acciones usan <code>GET /api/v1/admin/users</code>,{" "}
            <code>POST /api/v1/admin/users</code> y{" "}
            <code>POST /api/v1/admin/password-resets</code>. Si un USER
            intentara llamarlas directamente, el Backend debe responder 403.
          </p>

          <p className="button-row">
            <button
              className="button button--secondary"
              type="button"
              onClick={loadAdminUsers}
              disabled={adminBusy}
            >
              {adminBusy ? "Consultando…" : "Consultar usuarios"}
            </button>
          </p>

          {adminStatus && (
            <Notice kind="success" role="status">
              {adminStatus}
            </Notice>
          )}
          {adminError && (
            <Notice kind="error" role="alert">
              {adminError}
            </Notice>
          )}

          {resetResult && (
            <Notice kind="warning" role="status">
              Código temporal para <strong>{resetResult.email}</strong>:{" "}
              <code className="secret-code">{resetResult.code}</code>
              <br />
              Se muestra una sola vez y no se guarda en el navegador.
              {resetResult.expiresAt
                ? ` Vence según el servidor: ${resetResult.expiresAt}.`
                : " Entrégalo por el canal acordado y no lo publiques."}
            </Notice>
          )}
          {resetError && (
            <Notice kind="error" role="alert">
              {resetError}
            </Notice>
          )}

          {adminUsers && (
            <div className="table-wrap">
              <table aria-describedby="admin-users-caption">
                <caption id="admin-users-caption" className="sr-only">
                  Usuarios devueltos por la API administrativa
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Correo</th>
                    <th scope="col">Rol</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Recuperación</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.length === 0 ? (
                    <tr>
                      <td colSpan="4">No hay usuarios para mostrar.</td>
                    </tr>
                  ) : (
                    adminUsers.map((item) => (
                      <tr key={item.id || item.email}>
                        <td>{item.email || "—"}</td>
                        <td>
                          <span
                            className={`badge${
                              item.role === "ADMIN" ? " badge--admin" : ""
                            }`}
                          >
                            {roleLabel(item.role)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              item.active === true
                                ? "badge--active"
                                : item.active === false
                                  ? "badge--inactive"
                                  : ""
                            }`}
                          >
                            {item.active === true
                              ? "Activo"
                              : item.active === false
                                ? "Inactivo"
                                : "Sin dato"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="button button--secondary button--small"
                            type="button"
                            onClick={() => handleIssueReset(item)}
                            disabled={resetBusyId === item.id}
                            aria-label={`Generar código para ${item.email}`}
                          >
                            {resetBusyId === item.id
                              ? "Generando…"
                              : "Generar código"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <h3>Crear cuenta autorizada</h3>
          <p className="hint">
            No existe registro público. La cuenta nueva no recibe una
            contraseña visible; se activa con el procedimiento que defina
            Backend.
          </p>

          <form className="admin-form" onSubmit={handleCreateUser}>
            <div className="field">
              <label htmlFor="new-user-email">Correo de la nueva cuenta</label>
              <input
                id="new-user-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="off"
                maxLength="254"
                placeholder="nuevo@example.com"
                value={newUser.email}
                onChange={updateNewUser}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="new-user-role">Rol de la nueva cuenta</label>
              <select
                id="new-user-role"
                name="role"
                value={newUser.role}
                onChange={updateNewUser}
              >
                <option value="USER">Usuario</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>

            <button className="button" type="submit" disabled={createBusy}>
              {createBusy ? "Creando…" : "Crear cuenta"}
            </button>
          </form>

          {createStatus && (
            <Notice kind="success" role="status">
              {createStatus}
            </Notice>
          )}
          {createError && (
            <Notice kind="error" role="alert">
              {createError}
            </Notice>
          )}

          <h3>Emitir código temporal</h3>
          <p className="hint">
            Consulta la lista y usa «Generar código» en la cuenta
            correspondiente. El código se muestra solo en esta pantalla y debe
            entregarse por el canal acordado; el sistema no envía correos.
          </p>
        </section>
      )}
    </div>
  );
}
