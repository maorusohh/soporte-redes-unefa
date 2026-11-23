/**
 * Mock local del contrato AUTH-001 para desarrollo y pruebas del Frontend.
 *
 * No es Backend real ni sustituye FastAPI/PostgreSQL. Usa datos sintéticos en
 * memoria, HTTP sin TLS y contraseñas de demostración. No debe presentarse
 * como integración real ni usarse con credenciales personales.
 *
 * Uso:
 *   npm run mock
 *   npm run dev
 *
 * Implementa los nueve endpoints de docs/10-CONTRATO-INTEGRACION-AUTH.md y el
 * patrón provisional double-submit cookie para CSRF. Los nombres de cookie y
 * cabecera deben confirmarse con Backend antes de la integración.
 */

import crypto from "node:crypto";
import http from "node:http";
import { pathToFileURL } from "node:url";

const SESSION_COOKIE = "session_id";
const CSRF_COOKIE = "csrf_token";
const CSRF_HEADER = "x-csrf-token";
const SESSION_TTL_MS = 30 * 60 * 1000;
const RESET_TTL_MS = 15 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 8;

const DEMO_ADMIN_EMAIL = "admin@example.com";
const DEMO_USER_EMAIL = "user@example.com";
const DEMO_INACTIVE_EMAIL = "inactive@example.com";

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    active: user.active
  };
}

function createState() {
  return {
    users: [
      {
        id: crypto.randomUUID(),
        email: DEMO_ADMIN_EMAIL,
        password: process.env.MOCK_ADMIN_PASSWORD || "AdminDemo123!",
        role: "ADMIN",
        active: true
      },
      {
        id: crypto.randomUUID(),
        email: DEMO_USER_EMAIL,
        password: process.env.MOCK_USER_PASSWORD || "UserDemo123!",
        role: "USER",
        active: true
      },
      {
        id: crypto.randomUUID(),
        email: DEMO_INACTIVE_EMAIL,
        password: process.env.MOCK_INACTIVE_PASSWORD || "InactiveDemo123!",
        role: "USER",
        active: false
      }
    ],
    sessions: new Map(),
    resetCodes: new Map()
  };
}

function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) {
    return {};
  }

  const cookies = {};
  for (const part of header.split(";")) {
    const entry = part.trim();
    const separator = entry.indexOf("=");
    if (separator === -1) {
      continue;
    }
    const name = entry.slice(0, separator);
    const value = entry.slice(separator + 1);
    try {
      cookies[name] = decodeURIComponent(value);
    } catch {
      cookies[name] = value;
    }
  }
  return cookies;
}

function appendCookie(res, cookie) {
  const current = res.getHeader("Set-Cookie");
  const list = current ? [].concat(current) : [];
  list.push(cookie);
  res.setHeader("Set-Cookie", list);
}

function clearCookies(res) {
  appendCookie(
    res,
    `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
  );
  appendCookie(res, `${CSRF_COOKIE}=; SameSite=Lax; Path=/; Max-Age=0`);
}

function sendJson(res, status, payload, headers = {}) {
  const body = payload === undefined ? "" : JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers
  });
  res.end(body);
}

function sendNoContent(res) {
  res.writeHead(204, { "Cache-Control": "no-store" });
  res.end();
}

async function readJson(req) {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1_000_000) {
      throw new Error("Cuerpo demasiado grande");
    }
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return null;
  }
}

function currentUser(req, state) {
  const cookies = parseCookies(req);
  const token = cookies[SESSION_COOKIE];
  if (!token) {
    return null;
  }

  const session = state.sessions.get(token);
  if (!session || session.revokedAt || session.expiresAt <= Date.now()) {
    state.sessions.delete(token);
    return null;
  }

  return state.users.find((user) => user.id === session.userId) || null;
}

function validCsrf(req) {
  const cookies = parseCookies(req);
  const header = req.headers[CSRF_HEADER];
  return Boolean(
    header && cookies[CSRF_COOKIE] && header === cookies[CSRF_COOKIE]
  );
}

function revokeUserSessions(state, userId) {
  for (const [token, session] of state.sessions.entries()) {
    if (session.userId === userId) {
      state.sessions.delete(token);
    }
  }
}

function issueSession(res, state, user) {
  const token = randomToken();
  state.sessions.set(token, {
    userId: user.id,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS
  });

  // Sin Secure porque el mock se usa en HTTP local. Backend real debe usar
  // Secure cuando exista HTTPS.
  appendCookie(
    res,
    `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/`
  );
  appendCookie(
    res,
    `${CSRF_COOKIE}=${randomToken()}; SameSite=Lax; Path=/`
  );
}

function isValidEmail(email) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

function requireSession(req, res, state) {
  const user = currentUser(req, state);
  if (!user) {
    sendJson(res, 401, { detail: "Sesión ausente o inválida" });
    return null;
  }
  return user;
}

function requireAdmin(req, res, state) {
  const user = requireSession(req, res, state);
  if (!user) {
    return null;
  }
  if (user.role !== "ADMIN") {
    sendJson(res, 403, { detail: "Se requieren permisos de ADMIN" });
    return null;
  }
  if (!validCsrf(req)) {
    sendJson(res, 403, { detail: "Token CSRF ausente o inválido" });
    return null;
  }
  return user;
}

async function handle(req, res, state) {
  const url = new URL(req.url, "http://localhost");
  const pathname = url.pathname.replace(/\/+$/, "") || "/";
  const method = req.method || "GET";
  const route = `${method} ${pathname}`;

  if (pathname === "/api/v1/auth/login" && method === "POST") {
    const body = await readJson(req);
    if (!body) {
      return sendJson(res, 422, { detail: "JSON inválido" });
    }

    const email = normalizeEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";
    const user = state.users.find((item) => item.email === email);

    if (!user || !user.active || !user.password || user.password !== password) {
      return sendJson(res, 401, { detail: "Credenciales inválidas" });
    }

    issueSession(res, state, user);
    return sendJson(res, 200, { user: publicUser(user) });
  }

  if (pathname === "/api/v1/auth/me" && method === "GET") {
    const user = requireSession(req, res, state);
    if (!user) {
      return undefined;
    }
    return sendJson(res, 200, { user: publicUser(user) });
  }

  if (pathname === "/api/v1/auth/logout" && method === "POST") {
    const user = requireSession(req, res, state);
    if (!user) {
      return undefined;
    }
    if (!validCsrf(req)) {
      return sendJson(res, 403, { detail: "Token CSRF ausente o inválido" });
    }

    const { [SESSION_COOKIE]: token } = parseCookies(req);
    state.sessions.delete(token);
    clearCookies(res);
    return sendNoContent(res);
  }

  if (pathname === "/api/v1/auth/change-password" && method === "POST") {
    const user = requireSession(req, res, state);
    if (!user) {
      return undefined;
    }
    if (!validCsrf(req)) {
      return sendJson(res, 403, { detail: "Token CSRF ausente o inválido" });
    }

    const body = await readJson(req);
    if (
      !body ||
      typeof body.current_password !== "string" ||
      typeof body.new_password !== "string"
    ) {
      return sendJson(res, 422, { detail: "Datos incompletos" });
    }
    if (user.password !== body.current_password) {
      return sendJson(res, 401, { detail: "Contraseña actual inválida" });
    }
    if (body.new_password.length < MIN_PASSWORD_LENGTH) {
      return sendJson(res, 422, {
        detail: `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`
      });
    }

    user.password = body.new_password;
    revokeUserSessions(state, user.id);
    clearCookies(res);
    return sendNoContent(res);
  }

  if (pathname === "/api/v1/auth/forgot-password" && method === "POST") {
    const body = await readJson(req);
    if (!body) {
      return sendJson(res, 422, { detail: "JSON inválido" });
    }
    // Respuesta genérica: no revela si la cuenta existe y no envía correos.
    return sendJson(res, 202, {
      detail:
        "Solicitud registrada. Un administrador debe verificar tu identidad."
    });
  }

  if (pathname === "/api/v1/auth/reset-password" && method === "POST") {
    const body = await readJson(req);
    if (
      !body ||
      typeof body.email !== "string" ||
      typeof body.code !== "string" ||
      typeof body.new_password !== "string"
    ) {
      return sendJson(res, 422, { detail: "Datos incompletos" });
    }

    const email = normalizeEmail(body.email);
    const code = body.code.trim();
    const entry = state.resetCodes.get(code);

    if (
      !entry ||
      entry.consumedAt ||
      entry.expiresAt <= Date.now() ||
      entry.email !== email
    ) {
      return sendJson(res, 400, {
        detail: "Código inválido, usado o expirado"
      });
    }

    if (body.new_password.length < MIN_PASSWORD_LENGTH) {
      return sendJson(res, 422, {
        detail: `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`
      });
    }

    const user = state.users.find((item) => item.id === entry.userId);
    if (!user) {
      return sendJson(res, 400, { detail: "Código inválido" });
    }

    user.password = body.new_password;
    entry.consumedAt = Date.now();
    revokeUserSessions(state, user.id);
    return sendNoContent(res);
  }

  if (pathname === "/api/v1/admin/users" && method === "GET") {
    const admin = requireSession(req, res, state);
    if (!admin) {
      return undefined;
    }
    if (admin.role !== "ADMIN") {
      return sendJson(res, 403, { detail: "Se requieren permisos de ADMIN" });
    }
    return sendJson(res, 200, { users: state.users.map(publicUser) });
  }

  if (pathname === "/api/v1/admin/users" && method === "POST") {
    const admin = requireAdmin(req, res, state);
    if (!admin) {
      return undefined;
    }

    const body = await readJson(req);
    if (!body) {
      return sendJson(res, 422, { detail: "JSON inválido" });
    }

    const email = normalizeEmail(body.email);
    const role = typeof body.role === "string" ? body.role.trim() : "";
    if (!isValidEmail(email) || !["ADMIN", "USER"].includes(role)) {
      return sendJson(res, 422, { detail: "Correo o rol inválido" });
    }
    if (state.users.some((item) => item.email === email)) {
      return sendJson(res, 409, {
        detail: "Ya existe una cuenta con ese correo"
      });
    }

    const user = {
      id: crypto.randomUUID(),
      email,
      password: null,
      role,
      active: true
    };
    state.users.push(user);
    return sendJson(res, 201, { user: publicUser(user) });
  }

  if (pathname === "/api/v1/admin/password-resets" && method === "POST") {
    const admin = requireAdmin(req, res, state);
    if (!admin) {
      return undefined;
    }

    const body = await readJson(req);
    if (!body || typeof body.user_id !== "string") {
      return sendJson(res, 422, { detail: "user_id es obligatorio" });
    }

    const user = state.users.find((item) => item.id === body.user_id);
    if (!user) {
      return sendJson(res, 404, { detail: "La cuenta no existe" });
    }

    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    const expiresAt = Date.now() + RESET_TTL_MS;
    state.resetCodes.set(code, {
      userId: user.id,
      email: user.email,
      createdAt: Date.now(),
      expiresAt,
      consumedAt: null
    });

    return sendJson(res, 201, {
      code,
      expires_at: new Date(expiresAt).toISOString(),
      user_id: user.id
    });
  }

  return sendJson(res, 404, { detail: `Ruta no implementada: ${route}` });
}

/**
 * Inicia el mock. Con port 0 el sistema asigna uno libre (útil en pruebas).
 */
export function startMockApi({ port = 8000, host = "127.0.0.1", silent = false } = {}) {
  const state = createState();
  const server = http.createServer((req, res) => {
    handle(req, res, state).catch(() => {
      if (!res.headersSent) {
        sendJson(res, 500, { detail: "Error interno del mock" });
      } else {
        res.end();
      }
    });
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      const address = server.address();
      const actualPort = typeof address === "object" && address ? address.port : port;

      if (!silent) {
        console.log(
          `Mock del contrato AUTH-001 en http://${host}:${actualPort}/api/v1`
        );
        console.log(
          "Datos sintéticos: admin@example.com / user@example.com / inactive@example.com"
        );
        console.log(
          "No es Backend real: no uses credenciales personales ni lo publiques como integración."
        );
      }

      resolve({
        port: actualPort,
        server,
        state,
        close: () =>
          new Promise((closeResolve) => {
            server.close(() => closeResolve());
          })
      });
    });
  });
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const port = Number.parseInt(process.env.MOCK_PORT || "8000", 10);
  const api = await startMockApi({ port });

  const shutdown = async () => {
    await api.close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
