/**
 * Cliente HTTP del prototipo FRONT-002.
 *
 * Contrato de referencia: docs/10-CONTRATO-INTEGRACION-AUTH.md
 * - Todas las rutas se sirven bajo /api/v1 en el mismo origen.
 * - La cookie de sesión es HttpOnly y la administra el navegador.
 * - No se guardan credenciales ni tokens en localStorage/sessionStorage.
 * - El mecanismo CSRF definitivo sigue pendiente en Backend; no se inventa aquí.
 */
(function () {
  "use strict";

  const API_BASE = window.AUTH_API_BASE || "/api/v1";

  class ApiError extends Error {
    constructor(status, detail, payload) {
      super(detail || "Error de la API");
      this.name = "ApiError";
      this.status = status;
      this.detail = detail || "";
      this.payload = payload;
    }
  }

  function extractDetail(payload) {
    if (payload && typeof payload.detail === "string") {
      return payload.detail;
    }
    return "";
  }

  async function request(path, options) {
    const settings = options || {};
    const init = {
      method: settings.method || "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json" }
    };

    if (settings.body !== undefined) {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(settings.body);
    }

    let response;
    try {
      response = await fetch(API_BASE + path, init);
    } catch (error) {
      throw new ApiError(0, "", null);
    }

    let payload = null;
    if (response.status !== 204) {
      const text = await response.text();
      if (text) {
        try {
          payload = JSON.parse(text);
        } catch (error) {
          payload = text;
        }
      }
    }

    if (!response.ok) {
      throw new ApiError(response.status, extractDetail(payload), payload);
    }

    return payload;
  }

  function messageFor(error, fallback, overrides) {
    const status = error && typeof error.status === "number" ? error.status : 0;
    const custom = overrides || {};

    if (Object.prototype.hasOwnProperty.call(custom, status)) {
      return custom[status];
    }

    const messages = {
      0: "No se pudo conectar con el servidor. Verifica que la aplicación esté en ejecución y que uses el mismo origen.",
      401: "Tu sesión no es válida o expiró. Inicia sesión de nuevo.",
      403: "No tienes permisos para realizar esta acción.",
      404: "La ruta de la API todavía no está disponible en este servidor.",
      409: "La operación no se pudo completar por un conflicto con los datos actuales.",
      422: "Revisa los datos ingresados e inténtalo de nuevo.",
      429: "Demasiados intentos. Espera un momento antes de volver a probar.",
      500: "El servidor encontró un error. Inténtalo más tarde."
    };

    if (messages[status]) {
      return messages[status];
    }

    if (error && error.detail) {
      return error.detail;
    }

    return fallback;
  }

  window.AuthApi = {
    ApiError,
    messageFor,

    login: function (email, password) {
      return request("/auth/login", {
        method: "POST",
        body: { email: email, password: password }
      });
    },

    me: function () {
      return request("/auth/me");
    },

    logout: function () {
      return request("/auth/logout", { method: "POST" });
    },

    changePassword: function (currentPassword, newPassword) {
      return request("/auth/change-password", {
        method: "POST",
        body: {
          current_password: currentPassword,
          new_password: newPassword
        }
      });
    },

    forgotPassword: function (email) {
      return request("/auth/forgot-password", {
        method: "POST",
        body: { email: email }
      });
    },

    resetPassword: function (email, code, newPassword) {
      return request("/auth/reset-password", {
        method: "POST",
        body: {
          email: email,
          code: code,
          new_password: newPassword
        }
      });
    },

    listUsers: function () {
      return request("/admin/users");
    }
  };
})();
