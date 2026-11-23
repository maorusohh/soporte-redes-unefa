import { describe, expect, it } from "vitest";
import {
  initialSessionState,
  normalizeUser,
  normalizeUserList,
  sessionReducer
} from "./session.js";

const admin = { id: "u1", email: "admin@example.com", role: "ADMIN" };

describe("validación de usuarios de sesión", () => {
  it("normaliza un usuario válido y recorta espacios", () => {
    expect(
      normalizeUser({
        id: " u1 ",
        email: " admin@example.com ",
        role: "ADMIN",
        active: true
      })
    ).toEqual({
      id: "u1",
      email: "admin@example.com",
      role: "ADMIN",
      active: true
    });
  });

  it.each([
    null,
    {},
    { id: "u1", email: "admin@example.com", role: "ROOT" },
    { id: "", email: "admin@example.com", role: "ADMIN" },
    { id: "u1", email: "", role: "ADMIN" }
  ])("rechaza una forma inválida: %j", (value) => {
    expect(() => normalizeUser(value, "/auth/me")).toThrow(
      "Respuesta inesperada de /auth/me"
    );
  });

  it("rechaza una lista que no es arreglo o contiene elementos inválidos", () => {
    expect(() => normalizeUserList({}, "/admin/users")).toThrow(
      "Respuesta inesperada de /admin/users"
    );
    expect(() => normalizeUserList([admin, { id: "x" }], "/admin/users")).toThrow(
      "Respuesta inesperada de /admin/users"
    );
  });
});

describe("reducer de sesión", () => {
  it("aplica la respuesta de la petición más reciente", () => {
    const loading = sessionReducer(initialSessionState, {
      type: "REQUEST",
      requestId: 1
    });
    const authenticated = sessionReducer(loading, {
      type: "AUTHENTICATED",
      requestId: 1,
      user: admin
    });

    expect(authenticated.status).toBe("authenticated");
    expect(authenticated.user).toEqual(admin);
    expect(authenticated.requestId).toBe(1);
  });

  it("ignora una respuesta vieja que intenta sobrescribir el login", () => {
    const loading = sessionReducer(initialSessionState, {
      type: "REQUEST",
      requestId: 1
    });
    const invalidated = sessionReducer(loading, {
      type: "INVALIDATE",
      requestId: 2
    });
    const authenticated = sessionReducer(invalidated, {
      type: "AUTHENTICATED",
      requestId: 2,
      user: admin
    });

    const stale = sessionReducer(authenticated, {
      type: "ANONYMOUS",
      requestId: 1
    });

    expect(stale).toBe(authenticated);
    expect(stale.status).toBe("authenticated");
  });

  it("ignora un error obsoleto después de una sesión más nueva", () => {
    const state = {
      status: "authenticated",
      user: admin,
      error: null,
      requestId: 3
    };

    const stale = sessionReducer(state, {
      type: "ERROR",
      requestId: 2,
      error: new Error("fallo viejo")
    });

    expect(stale).toBe(state);
  });

  it("marca error si se intenta autenticar un rol desconocido", () => {
    const loading = sessionReducer(initialSessionState, {
      type: "REQUEST",
      requestId: 1
    });
    const result = sessionReducer(loading, {
      type: "AUTHENTICATED",
      requestId: 1,
      user: { id: "u1", email: "x@example.com", role: "ROOT" }
    });

    expect(result.status).toBe("error");
    expect(result.user).toBeNull();
  });

  it("rechaza identificadores de petición inválidos", () => {
    expect(() =>
      sessionReducer(initialSessionState, { type: "REQUEST", requestId: 0 })
    ).toThrow("requestId inválido");
  });
});
