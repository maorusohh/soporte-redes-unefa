import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi, messageFor } from "../api/client.js";
import { useAuth } from "../auth/AuthProvider.jsx";
import FocusHeading from "../components/FocusHeading.jsx";
import Notice from "../components/Notice.jsx";
import SessionGate from "../components/SessionGate.jsx";
import { roleDescription, roleLabel } from "../utils/roles.js";

export default function SessionPage() {
  return (
    <SessionGate>
      {(user) => <SessionContent user={user} />}
    </SessionGate>
  );
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
      if (!Array.isArray(data?.users)) {
        throw new Error("Respuesta inesperada de /admin/users");
      }
      setAdminStatus(
        "Consulta completada. El servidor confirmó el acceso de ADMIN."
      );
      setAdminUsers(data.users);
    } catch (error) {
      setAdminError(
        messageFor(error, "No se pudo consultar la lista de usuarios.", {
          401: "La sesión expiró. Vuelve a iniciar sesión.",
          403: "El servidor rechazó la consulta con 403: esta cuenta no tiene permisos de ADMIN."
        })
      );
    } finally {
      setAdminBusy(false);
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
          <h2 id="admin-users-title">Usuarios autorizados</h2>
          <p className="muted">
            Esta consulta usa <code>GET /api/v1/admin/users</code>. Si un USER
            intentara llamar a la ruta directamente, el Backend debe responder
            403.
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
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.length === 0 ? (
                    <tr>
                      <td colSpan="3">No hay usuarios para mostrar.</td>
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
                              item.active
                                ? "badge--active"
                                : "badge--inactive"
                            }`}
                          >
                            {item.active ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
