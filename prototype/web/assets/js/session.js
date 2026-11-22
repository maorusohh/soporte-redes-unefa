/**
 * Pantalla de sesión. Consulta /auth/me, permite logout y muestra
 * la sección administrativa únicamente cuando el rol devuelto es ADMIN.
 */
(function () {
  "use strict";

  const loading = document.getElementById("session-loading");
  const guest = document.getElementById("session-guest");
  const errorPanel = document.getElementById("session-error");
  const content = document.getElementById("session-content");
  const adminSection = document.getElementById("admin-users-section");

  const emailValue = document.getElementById("session-email");
  const roleValue = document.getElementById("session-role");
  const roleNote = document.getElementById("role-note");
  const errorMessage = document.getElementById("session-error-message");
  const logoutButton = document.getElementById("logout-button");
  const logoutStatus = document.getElementById("logout-status");

  const adminLoadButton = document.getElementById("admin-users-load");
  const adminStatus = document.getElementById("admin-users-status");
  const adminError = document.getElementById("admin-users-error");
  const adminTableWrap = document.getElementById("admin-users-table-wrap");
  const adminRows = document.getElementById("admin-users-rows");

  function roleLabel(role) {
    if (role === "ADMIN") {
      return "Administrador";
    }
    if (role === "USER") {
      return "Usuario";
    }
    return role || "Sin rol";
  }

  function renderUser(user) {
    emailValue.textContent = UI.text(user.email, "—");
    roleValue.textContent = roleLabel(user.role);
    roleValue.classList.toggle("badge--admin", user.role === "ADMIN");

    if (user.role === "ADMIN") {
      roleNote.textContent = "Como ADMIN puedes consultar la lista de usuarios autorizados. Las operaciones de escritura siguen pendientes en Backend.";
      UI.show(adminSection);
    } else {
      roleNote.textContent = "Tu rol no incluye la gestión de usuarios. Las acciones administrativas no se muestran y el servidor también debe rechazarlas.";
      UI.hide(adminSection);
    }

    UI.hide(loading);
    UI.hide(guest);
    UI.hide(errorPanel);
    UI.show(content);
    document.getElementById("session-title").focus();
  }

  async function loadSession() {
    UI.show(loading);
    UI.hide(guest);
    UI.hide(content);
    UI.hide(errorPanel);
    UI.hide(adminSection);
    UI.clearMessage(logoutStatus);

    try {
      const data = await AuthApi.me();
      if (!data || !data.user) {
        throw new AuthApi.ApiError(500, "Respuesta inesperada de /auth/me");
      }
      renderUser(data.user);
    } catch (error) {
      UI.hide(loading);

      if (error.status === 401) {
        UI.show(guest);
        document.getElementById("guest-title").focus();
        return;
      }

      UI.setMessage(
        errorMessage,
        AuthApi.messageFor(error, "No se pudo consultar la sesión."),
        "error"
      );
      UI.show(errorPanel);
      document.getElementById("session-error-title").focus();
    }
  }

  function renderUsers(users) {
    adminRows.replaceChildren();

    if (!Array.isArray(users) || users.length === 0) {
      const row = adminRows.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 3;
      cell.textContent = "No hay usuarios para mostrar.";
      UI.show(adminTableWrap);
      return;
    }

    for (const user of users) {
      const row = adminRows.insertRow();

      const emailCell = row.insertCell();
      emailCell.textContent = UI.text(user.email, "—");

      const roleCell = row.insertCell();
      const roleBadge = document.createElement("span");
      roleBadge.className = "badge" + (user.role === "ADMIN" ? " badge--admin" : "");
      roleBadge.textContent = roleLabel(user.role);
      roleCell.appendChild(roleBadge);

      const stateCell = row.insertCell();
      const stateBadge = document.createElement("span");
      const isActive = user.active === true;
      stateBadge.className = "badge " + (isActive ? "badge--active" : "badge--inactive");
      stateBadge.textContent = isActive ? "Activo" : "Inactivo";
      stateCell.appendChild(stateBadge);
    }

    UI.show(adminTableWrap);
  }

  async function loadAdminUsers() {
    UI.clearMessage(adminStatus);
    UI.clearMessage(adminError);
    UI.hide(adminTableWrap);
    UI.setBusy(adminLoadButton, true, "Consultando…");

    try {
      const data = await AuthApi.listUsers();
      if (!data || !Array.isArray(data.users)) {
        throw new AuthApi.ApiError(500, "Respuesta inesperada de /admin/users");
      }
      UI.setMessage(adminStatus, "Consulta completada. El servidor confirmó el acceso de ADMIN.", "success");
      renderUsers(data.users);
    } catch (error) {
      UI.setMessage(
        adminError,
        AuthApi.messageFor(error, "No se pudo consultar la lista de usuarios.", {
          401: "La sesión expiró. Vuelve a iniciar sesión.",
          403: "El servidor rechazó la consulta con 403: esta cuenta no tiene permisos de ADMIN."
        }),
        "error"
      );
    } finally {
      UI.setBusy(adminLoadButton, false);
    }
  }

  logoutButton.addEventListener("click", async function () {
    UI.clearMessage(logoutStatus);
    UI.setBusy(logoutButton, true, "Cerrando…");

    try {
      await AuthApi.logout();
      window.location.assign("login.html?notice=logged-out");
    } catch (error) {
      if (error.status === 401) {
        window.location.assign("login.html?notice=session-expired");
        return;
      }
      UI.setMessage(
        logoutStatus,
        AuthApi.messageFor(error, "No se pudo cerrar la sesión. Inténtalo de nuevo."),
        "error"
      );
    } finally {
      UI.setBusy(logoutButton, false);
    }
  });

  adminLoadButton.addEventListener("click", loadAdminUsers);
  document.getElementById("session-retry").addEventListener("click", loadSession);

  loadSession();
})();
