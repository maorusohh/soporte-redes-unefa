/**
 * Cambio de contraseña autenticado. Exige /auth/me antes de mostrar el
 * formulario y no inicia sesión de nuevo después del cambio.
 */
(function () {
  "use strict";

  const loading = document.getElementById("password-loading");
  const guest = document.getElementById("password-guest");
  const errorPanel = document.getElementById("password-error-panel");
  const content = document.getElementById("password-content");
  const success = document.getElementById("password-success");

  const account = document.getElementById("password-account");
  const form = document.getElementById("password-form");
  const currentPassword = document.getElementById("current-password");
  const newPassword = document.getElementById("new-password");
  const confirmPassword = document.getElementById("confirm-password");
  const submitButton = document.getElementById("password-submit");
  const formError = document.getElementById("password-form-error");
  const errorMessage = document.getElementById("password-error-message");

  async function loadSession() {
    UI.show(loading);
    UI.hide(guest);
    UI.hide(errorPanel);
    UI.hide(content);
    UI.hide(success);
    UI.show(form);
    UI.clearMessage(formError);

    try {
      const data = await AuthApi.me();
      if (!data || !data.user) {
        throw new AuthApi.ApiError(500, "Respuesta inesperada de /auth/me");
      }
      account.textContent = UI.text(data.user.email, "cuenta sin correo");
      UI.hide(loading);
      UI.show(content);
      document.getElementById("password-title").focus();
    } catch (error) {
      UI.hide(loading);

      if (error.status === 401) {
        UI.show(guest);
        document.getElementById("password-guest-title").focus();
        return;
      }

      UI.setMessage(
        errorMessage,
        AuthApi.messageFor(error, "No se pudo consultar la sesión."),
        "error"
      );
      UI.show(errorPanel);
      document.getElementById("password-error-title").focus();
    }
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    UI.clearMessage(formError);

    const values = UI.formObject(form);
    const current = String(values.current_password || "");
    const next = String(values.new_password || "");
    const confirmation = String(values.confirm_password || "");

    if (!current || !next || !confirmation) {
      UI.setMessage(formError, "Completa las tres contraseñas.", "error");
      return;
    }

    if (next !== confirmation) {
      UI.setMessage(formError, "Las dos contraseñas nuevas no coinciden.", "error");
      confirmPassword.value = "";
      confirmPassword.focus();
      return;
    }

    UI.setBusy(submitButton, true, "Actualizando…");

    try {
      await AuthApi.changePassword(current, next);
      UI.hide(form);
      UI.show(success);
      document.getElementById("password-success-title").focus();
    } catch (error) {
      UI.setMessage(
        formError,
        AuthApi.messageFor(error, "No se pudo cambiar la contraseña.", {
          401: "Tu sesión expiró o la contraseña actual no es válida. Vuelve a iniciar sesión si el problema continúa.",
          403: "El servidor rechazó el cambio para esta cuenta.",
          422: "Revisa la contraseña actual y que la nueva cumpla la política del servidor."
        }),
        "error"
      );
      currentPassword.value = "";
      newPassword.value = "";
      confirmPassword.value = "";
      currentPassword.focus();
    } finally {
      UI.setBusy(submitButton, false);
    }
  });

  document.getElementById("password-retry").addEventListener("click", loadSession);

  loadSession();
})();
