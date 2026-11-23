/**
 * Cliente HTTP del prototipo FRONT-002.
 *
 * Contrato: docs/10-CONTRATO-INTEGRACION-AUTH.md
 * - Rutas bajo /api/v1 en el mismo origen.
 * - La cookie de sesión es HttpOnly y la administra el navegador.
 * - No se guardan credenciales ni tokens en localStorage/sessionStorage.
 * - El mecanismo CSRF definitivo sigue pendiente en Backend. Mientras se
 *   acuerda, el cliente aplica el patrón double-submit cookie: lee el token
 *   de una cookie legible por JavaScript y lo envía en una cabecera para las
 *   operaciones mutantes. Los nombres son configurables y deben confirmarse
 *   con Backend antes de la integración real.
 */

const DEFAULT_API_BASE = "/api/v1";
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const env = (import.meta && import.meta.env) || {};

let warnedAboutBase = false;

function normalizeApiBase(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return DEFAULT_API_BASE;
  }
  return trimmed.replace(/\/+$/, "") || DEFAULT_API_BASE;
}

/**
 * Solo se acepta una ruta relativa del mismo origen. Una URL absoluta se
 * acepta únicamente si coincide con el origen actual; en ese caso se usa su
 * ruta. Una URL externa se descarta con una advertencia para no romper la
 * política de cookies de sesión del contrato.
 */
export function resolveApiBase(rawValue, currentOrigin) {
  if (!rawValue) {
    return DEFAULT_API_BASE;
  }

  const value = String(rawValue).trim();
  if (!value) {
    return DEFAULT_API_BASE;
  }

  if (value.startsWith("/")) {
    return normalizeApiBase(value);
  }

  if (currentOrigin) {
    try {
      const url = new URL(value, currentOrigin);
      if (url.origin === currentOrigin) {
        return normalizeApiBase(url.pathname);
      }
    } catch {
      // Se descarta abajo.
    }
  }

  if (!warnedAboutBase) {
    warnedAboutBase = true;
    console.warn(
      "[api] VITE_API_BASE debe ser del mismo origen. Se usará /api/v1."
    );
  }
  return DEFAULT_API_BASE;
}

export const apiBase = resolveApiBase(
  env.VITE_API_BASE,
  typeof window !== "undefined" ? window.location.origin : undefined
);

const CSRF_COOKIE = String(env.VITE_CSRF_COOKIE || "csrf_token").trim();
const CSRF_HEADER = String(env.VITE_CSRF_HEADER || "X-CSRF-Token").trim();
const CSRF_META = String(env.VITE_CSRF_META || "csrf-token").trim();

let csrfTokenMemory = "";

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

function readCookie(name) {
  if (typeof document === "undefined" || !document.cookie) {
    return "";
  }

  for (const part of document.cookie.split(";")) {
    const entry = part.trim();
    const separator = entry.indexOf("=");
    if (separator === -1) {
      continue;
    }
    if (entry.slice(0, separator) === name) {
      return decodeURIComponent(entry.slice(separator + 1));
    }
  }
  return "";
}

function readMetaToken() {
  if (typeof document === "undefined" || !CSRF_META) {
    return "";
  }

  const meta = Array.from(document.querySelectorAll("meta")).find(
    (item) => item.getAttribute("name") === CSRF_META
  );
  return meta?.getAttribute("content")?.trim() || "";
}

/**
 * El backend puede publicar el token en una cookie legible, en una etiqueta
 * meta o en la cabecera de una respuesta. La cookie es la fuente más reciente
 * cuando existe; el valor recordado se usa si Backend solo devuelve cabecera.
 */
export function getCsrfToken() {
  return readCookie(CSRF_COOKIE) || readMetaToken() || csrfTokenMemory;
}

/** Uso interno y pruebas: registra un token devuelto por Backend. */
export function setCsrfToken(token) {
  csrfTokenMemory = typeof token === "string" ? token.trim() : "";
}

export function clearCsrfToken() {
  csrfTokenMemory = "";
}

async function request(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const init = {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json" }
  };

  if (options.body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }

  if (MUTATING_METHODS.has(method)) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      init.headers[CSRF_HEADER] = csrfToken;
    }
  }

  let response;
  try {
    response = await fetch(apiBase + path, init);
  } catch {
    throw new ApiError(0, "", null);
  }

  const issuedToken = response.headers.get(CSRF_HEADER);
  if (issuedToken) {
    setCsrfToken(issuedToken);
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
  },

  createUser(email, role) {
    return request("/admin/users", {
      method: "POST",
      body: { email, role }
    });
  },

  requestPasswordReset(userId) {
    return request("/admin/password-resets", {
      method: "POST",
      body: { user_id: userId }
    });
  }
};
