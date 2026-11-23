import { ApiError } from "../api/client.js";

export const SESSION_STATUSES = Object.freeze([
  "loading",
  "authenticated",
  "anonymous",
  "error"
]);

export const USER_ROLES = Object.freeze(["ADMIN", "USER"]);

/**
 * Valida la forma mínima que el contrato exige para un usuario.
 * No confía en roles o identificadores ausentes: una respuesta inesperada
 * se trata como error de integración, nunca como una sesión válida.
 */
export function normalizeUser(rawUser, source = "la API") {
  if (!rawUser || typeof rawUser !== "object") {
    throw new ApiError(500, `Respuesta inesperada de ${source}`);
  }

  const id = typeof rawUser.id === "string" ? rawUser.id.trim() : "";
  const email = typeof rawUser.email === "string" ? rawUser.email.trim() : "";
  const role = typeof rawUser.role === "string" ? rawUser.role.trim() : "";

  if (!id || !email || !USER_ROLES.includes(role)) {
    throw new ApiError(500, `Respuesta inesperada de ${source}`);
  }

  const user = { id, email, role };
  if (typeof rawUser.active === "boolean") {
    user.active = rawUser.active;
  }
  return user;
}

export function normalizeUserList(rawUsers, source = "la API") {
  if (!Array.isArray(rawUsers)) {
    throw new ApiError(500, `Respuesta inesperada de ${source}`);
  }
  return rawUsers.map((item) => normalizeUser(item, source));
}

export const initialSessionState = Object.freeze({
  status: "loading",
  user: null,
  error: null,
  requestId: 0
});

function assertRequestId(requestId) {
  if (!Number.isInteger(requestId) || requestId < 1) {
    throw new Error("requestId inválido para el estado de sesión");
  }
}

function isCurrent(state, action) {
  return action.requestId === state.requestId;
}

/**
 * Reducer explícito para que una respuesta lenta no sobrescriba una sesión
 * más reciente. Cada petición recibe un requestId; solo la última puede
 * cambiar el estado. Las transiciones desconocidas se ignoran.
 */
export function sessionReducer(state, action) {
  switch (action.type) {
    case "REQUEST":
      assertRequestId(action.requestId);
      return {
        status: "loading",
        user: null,
        error: null,
        requestId: action.requestId
      };

    case "INVALIDATE":
      assertRequestId(action.requestId);
      return { ...state, requestId: action.requestId };

    case "AUTHENTICATED":
      if (!isCurrent(state, action)) {
        return state;
      }
      if (!action.user || !USER_ROLES.includes(action.user.role)) {
        return {
          status: "error",
          user: null,
          error: new ApiError(500, "Respuesta inesperada de la API"),
          requestId: state.requestId
        };
      }
      return {
        status: "authenticated",
        user: action.user,
        error: null,
        requestId: state.requestId
      };

    case "ANONYMOUS":
      if (!isCurrent(state, action)) {
        return state;
      }
      return {
        status: "anonymous",
        user: null,
        error: null,
        requestId: state.requestId
      };

    case "ERROR":
      if (!isCurrent(state, action)) {
        return state;
      }
      return {
        status: "error",
        user: null,
        error: action.error || new ApiError(0, "", null),
        requestId: state.requestId
      };

    default:
      return state;
  }
}
