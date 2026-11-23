import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  apiBase,
  authApi,
  clearCsrfToken,
  getCsrfToken,
  setCsrfToken
} from "./client.js";

function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers }
  });
}

function clearCookies() {
  document.cookie = "csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  document.cookie = "session_id=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
}

beforeEach(() => {
  clearCookies();
  clearCsrfToken();
});

afterEach(() => {
  clearCookies();
  clearCsrfToken();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("cliente del contrato", () => {
  it("usa /api/v1 del mismo origen por defecto", () => {
    expect(apiBase).toBe("/api/v1");
  });

  it("envía login como POST JSON con credenciales del mismo origen", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ user: { id: "u1", email: "user@example.com", role: "USER" } })
      );
    vi.stubGlobal("fetch", fetchMock);

    await authApi.login("user@example.com", "secreto-sintetico");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/auth/login");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("same-origin");
    expect(init.cache).toBe("no-store");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({
      email: "user@example.com",
      password: "secreto-sintetico"
    });
  });

  it("consulta la sesión con GET y sin cuerpo", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ user: { id: "u1", email: "user@example.com", role: "USER" } })
      );
    vi.stubGlobal("fetch", fetchMock);

    await authApi.me();

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/v1/auth/me");
    expect(init.method).toBe("GET");
    expect(init.body).toBeUndefined();
    expect(init.headers.Accept).toBe("application/json");
  });

  it("envía el token CSRF de la cookie solo en operaciones mutantes", async () => {
    document.cookie = "csrf_token=token-sintetico; path=/";
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await authApi.logout();
    await authApi.me();

    expect(fetchMock.mock.calls[0][1].headers["X-CSRF-Token"]).toBe(
      "token-sintetico"
    );
    expect(fetchMock.mock.calls[1][1].headers["X-CSRF-Token"]).toBeUndefined();
  });

  it("registra un token CSRF devuelto por cabecera y lo reutiliza", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        { user: { id: "u1", email: "user@example.com", role: "USER" } },
        200,
        { "X-CSRF-Token": "token-emitido" }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    await authApi.login("user@example.com", "secreto-sintetico");

    expect(getCsrfToken()).toBe("token-emitido");
  });

  it("prefiere la cookie vigente sobre un token recordado anterior", async () => {
    setCsrfToken("token-viejo");
    document.cookie = "csrf_token=token-cookie; path=/";
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    await authApi.logout();

    expect(fetchMock.mock.calls[0][1].headers["X-CSRF-Token"]).toBe(
      "token-cookie"
    );
  });

  it("acepta 204 sin cuerpo", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    await expect(authApi.logout()).resolves.toBeNull();
  });

  it("convierte errores de la API en ApiError con estado y detalle", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ detail: "No autorizado" }, 401))
    );

    await expect(authApi.me()).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      detail: "No autorizado"
    });
  });

  it("convierte un fallo de red en ApiError 0", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("sin red")));

    await expect(authApi.me()).rejects.toMatchObject({
      name: "ApiError",
      status: 0
    });
  });

  it("usa las rutas administrativas del contrato", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ users: [] }))
      .mockResolvedValueOnce(
        jsonResponse(
          { user: { id: "u2", email: "nuevo@example.com", role: "USER" } },
          201
        )
      )
      .mockResolvedValueOnce(
        jsonResponse({ code: "CODIGO-1234", expires_at: "2026-11-23T12:00:00Z" }, 201)
      );
    vi.stubGlobal("fetch", fetchMock);

    await authApi.listUsers();
    await authApi.createUser("nuevo@example.com", "USER");
    await authApi.requestPasswordReset("u2");

    expect(fetchMock.mock.calls[0][0]).toBe("/api/v1/admin/users");
    expect(fetchMock.mock.calls[0][1].method).toBe("GET");
    expect(fetchMock.mock.calls[1][0]).toBe("/api/v1/admin/users");
    expect(fetchMock.mock.calls[1][1].method).toBe("POST");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      email: "nuevo@example.com",
      role: "USER"
    });
    expect(fetchMock.mock.calls[2][0]).toBe("/api/v1/admin/password-resets");
    expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toEqual({
      user_id: "u2"
    });
  });

  it("acepta una URL absoluta solo si es del mismo origen", async () => {
    const origin = window.location.origin;
    vi.stubEnv("VITE_API_BASE", `${origin}/api/v1/`);
    vi.resetModules();

    const module = await import("./client.js");
    expect(module.apiBase).toBe("/api/v1");
  });

  it("descarta una URL externa y conserva la política de mismo origen", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubEnv("VITE_API_BASE", "https://servidor-externo.example/api/v1");
    vi.resetModules();

    const module = await import("./client.js");
    expect(module.apiBase).toBe("/api/v1");
    expect(warn).toHaveBeenCalled();
  });

  it("expone el detalle cuando no hay un mensaje conocido", () => {
    const error = new ApiError(418, "Detalle del servidor");
    expect(error).toBeInstanceOf(Error);
    expect(error.detail).toBe("Detalle del servidor");
  });
});
