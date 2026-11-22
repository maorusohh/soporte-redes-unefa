/**
 * Pantalla de acceso. Usa únicamente la API real; no simula credenciales.
 */
(function () {
  "use strict";

  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const submitButton = document.getElementById("login-submit");
  const errorBox = document.getElementById("login-error");
  const noticeBox = document.getElementById("login-notice");

  const notices = {
    "session-expired": "Tu sesión expiró. Vuelve a iniciar sesión.",
    "session-required": "Necesitas iniciar sesión para ver esa pantalla.",
    "logged-out": "La sesión se cerró correctamente.",
    "password-changed": "La contraseña se actualizó. Inicia sesión de nuevo.",
    "reset-success": "La contraseña se restableció. Inicia sesión con la nueva contraseña."
  };

  const noticeKey = new URLSearchParams(window.location.search).get("notice");
  if (noticeKey && notices[noticeKey]) {
    UI.setMessage(noticeBox, notices[noticeKey], "info");
  }

  async function redirectIfAuthenticated() {
    try {
      await AuthApi.me();
      window.location.replace("session.html");
    } catch (error) {
      // 401 es el caso esperado cuando todavía no hay sesión.
      // 404/0 también se ignoran para no ocultar el formulario en una vista sin Backend.
    }
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    UI.clearMessage(errorBox);

    const values = UI.formObject(form);
    const email = UI.text(values.email);
    const password = String(values.password || "");

    if (!email || !password) {
      UI.setMessage(errorBox, "Completa el correo y la contraseña.", "error");
      (email ? passwordInput : emailInput).focus();
      return;
    }

    UI.setBusy(submitButton, true, "Entrando…");

    try {
      await AuthApi.login(email, password);
      window.location.assign("session.html");
    } catch (error) {
      const overrides = {
        401: "Correo o contraseña incorrectos. Revisa tus datos o contacta al administrador.",
        403: "No se pudo iniciar sesión con esta cuenta. Contacta al administrador si el problema continúa.",
        422: "Revisa el formato del correo y completa la contraseña."
      };
      UI.setMessage(
        errorBox,
        AuthApi.messageFor(error, "No se pudo iniciar sesión. Inténtalo de nuevo.", overrides),
        "error"
      );
      passwordInput.value = "";
      passwordInput.focus();
    } finally {
      UI.setBusy(submitButton, false);
    }
  });

  redirectIfAuthenticated();
})();
