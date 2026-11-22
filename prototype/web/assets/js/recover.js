/**
 * Recuperación supervisada sin correo: solicitud genérica y canje de un
 * código temporal emitido por un ADMIN. No inicia sesión automáticamente.
 */
(function () {
  "use strict";

  const forgotForm = document.getElementById("forgot-form");
  const resetForm = document.getElementById("reset-form");
  const resetSuccess = document.getElementById("reset-success");

  const forgotEmail = document.getElementById("forgot-email");
  const forgotSubmit = document.getElementById("forgot-submit");
  const forgotStatus = document.getElementById("forgot-status");
  const forgotError = document.getElementById("forgot-error");

  const resetEmail = document.getElementById("reset-email");
  const resetCode = document.getElementById("reset-code");
  const newPassword = document.getElementById("new-password");
  const confirmPassword = document.getElementById("confirm-password");
  const resetSubmit = document.getElementById("reset-submit");
  const resetStatus = document.getElementById("reset-status");
  const resetError = document.getElementById("reset-error");

  forgotForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    UI.clearMessage(forgotError);
    UI.clearMessage(forgotStatus);

    const values = UI.formObject(forgotForm);
    const email = UI.text(values.email);

    if (!email) {
      UI.setMessage(forgotError, "Escribe el correo de la cuenta.", "error");
      forgotEmail.focus();
      return;
    }

    UI.setBusy(forgotSubmit, true, "Solicitando…");

    try {
      await AuthApi.forgotPassword(email);
      UI.setMessage(
        forgotStatus,
        "Solicitud registrada. Por seguridad, la respuesta es la misma exista o no la cuenta. Contacta al administrador autorizado para recibir un código temporal. No se envía ningún correo automático.",
        "success"
      );
      if (!resetEmail.value) {
        resetEmail.value = email;
      }
    } catch (error) {
      UI.setMessage(
        forgotError,
        AuthApi.messageFor(error, "No se pudo registrar la solicitud. Inténtalo de nuevo.", {
          422: "Revisa el formato del correo electrónico.",
          429: "Demasiadas solicitudes. Espera un momento antes de volver a intentar."
        }),
        "error"
      );
    } finally {
      UI.setBusy(forgotSubmit, false);
    }
  });

  resetForm.addEventListener("submit", async function (event) {
    event.preventDefault();
    UI.clearMessage(resetError);
    UI.clearMessage(resetStatus);

    const values = UI.formObject(resetForm);
    const email = UI.text(values.email);
    const code = UI.text(values.code);
    const password = String(values.new_password || "");
    const confirmation = String(values.confirm_password || "");

    if (!email || !code || !password || !confirmation) {
      UI.setMessage(resetError, "Completa el correo, el código y la nueva contraseña.", "error");
      return;
    }

    if (password !== confirmation) {
      UI.setMessage(resetError, "Las dos contraseñas nuevas no coinciden.", "error");
      confirmPassword.value = "";
      confirmPassword.focus();
      return;
    }

    UI.setBusy(resetSubmit, true, "Guardando…");

    try {
      await AuthApi.resetPassword(email, code, password);
      UI.hide(forgotForm);
      UI.hide(resetForm);
      UI.show(resetSuccess);
      document.getElementById("reset-success-title").focus();
    } catch (error) {
      const codeMessage = "El código no es válido, ya fue usado o expiró. Solicita uno nuevo al administrador.";
      UI.setMessage(
        resetError,
        AuthApi.messageFor(error, "No se pudo restablecer la contraseña.", {
          400: codeMessage,
          401: codeMessage,
          403: codeMessage,
          410: codeMessage,
          422: "No se pudo restablecer. Verifica el código temporal y que la nueva contraseña cumpla la política del servidor."
        }),
        "error"
      );
      newPassword.value = "";
      confirmPassword.value = "";
      resetCode.focus();
    } finally {
      UI.setBusy(resetSubmit, false);
    }
  });
})();
