/**
 * Cliente HTTP del prototipo FRONT-002.
 *
 * Contrato: docs/10-CONTRATO-INTEGRACION-AUTH.md
 * - Rutas bajo /api/v1 en el mismo origen.
 * - La cookie de sesión es HttpOnly y la administra el navegador.
 * - No se guardan credenciales ni tokens en localStorage/sessionStorage.
 * - El mecanismo CSRF definitivo sigue pendiente en Backend.
 */

const API_BASE =
  (import.meta.env && import.meta.env.VITE_API_BASE) || "/api/v1";

export class ApiError extends Error {
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

async function request(path, options = {}) {
  const init = {
    method: options.method || "GET",
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json" }
  };

  if (options.body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }

  let response;
  try {
    response = await fetch(API_BASE + path, init);
  } catch {
    throw new ApiError(0, "", null);
  }

  let payload = null;
  if (response.status !== 204) {
    const text = await response.text();
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, extractDetail(payload), payload);
  }

  return payload;
}

export function messageFor(error, fallback, overrides = {}) {
  const status = typeof error?.status === "number" ? error.status : 0;

  if (Object.prototype.hasOwnProperty.call(overrides, status)) {
    return overrides[status];
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

  return messages[status] || error?.detail || fallback;
}

export const authApi = {
  login(email, password) {
    return request("/auth/login", {
      method: "POST",
      body: { email, password }
    });
  },

  me() {
    return request("/auth/me");
  },

  logout() {
    return request("/auth/logout", { method: "POST" });
  },

  changePassword(currentPassword, newPassword) {
    return request("/auth/change-password", {
      method: "POST",
      body: {
        current_password: currentPassword,
        new_password: newPassword
      }
    });
  },

  forgotPassword(email) {
    return request("/auth/forgot-password", {
      method: "POST",
      body: { email }
    });
  },

  resetPassword(email, code, newPassword) {
    return request("/auth/reset-password", {
      method: "POST",
      body: {
        email,
        code,
        new_password: newPassword
      }
    });
  },

  listUsers() {
    return request("/admin/users");
  }
};
