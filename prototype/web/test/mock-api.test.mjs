// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { startMockApi } from "./mock-api.mjs";

let api;
let base;

beforeEach(async () => {
  api = await startMockApi({ port: 0, silent: true });
  base = `http://127.0.0.1:${api.port}/api/v1`;
});

afterEach(async () => {
  await api.close();
});

function readJar(response, jar = {}) {
  for (const raw of response.headers.getSetCookie()) {
    const pair = raw.split(";")[0];
    const separator = pair.indexOf("=");
    if (separator === -1) {
      continue;
    }
    const name = pair.slice(0, separator);
    const value = pair.slice(separator + 1);
    if (value) {
      jar[name] = value;
    } else {
      delete jar[name];
    }
  }
  return jar;
}

function cookieHeader(jar) {
  return Object.entries(jar)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

async function post(path, body, jar, extraHeaders = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...extraHeaders
  };
  if (jar) {
    headers.Cookie = cookieHeader(jar);
  }
  const response = await fetch(base + path, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });
  readJar(response, jar);
  return response;
}

async function login(email, password) {
  const jar = {};
  const response = await post("/auth/login", { email, password }, jar);
  return { response, jar, body: await response.json() };
}

describe("mock del contrato AUTH-001", () => {
  it("permite login real del mock y consulta /auth/me con cookie", async () => {
    const { response, jar, body } = await login(
      "admin@example.com",
      "AdminDemo123!"
    );

    expect(response.status).toBe(200);
    expect(body.user).toMatchObject({
      email: "admin@example.com",
      role: "ADMIN",
      active: true
    });
    expect(jar.session_id).toBeTruthy();
    expect(jar.csrf_token).toBeTruthy();

    const me = await fetch(base + "/auth/me", {
      headers: { Cookie: cookieHeader(jar) }
    });
    expect(me.status).toBe(200);
    expect((await me.json()).user.role).toBe("ADMIN");

    const anonymous = await fetch(base + "/auth/me");
    expect(anonymous.status).toBe(401);
  });

  it("no revela si el correo existe en login fallido", async () => {
    const { response, body } = await login(
      "admin@example.com",
      "contraseña-incorrecta"
    );

    expect(response.status).toBe(401);
    expect(body.detail).toBe("Credenciales inválidas");
    expect(body.detail).not.toContain("admin@example.com");
  });

  it("responde 403 cuando un USER intenta una ruta ADMIN", async () => {
    const { jar } = await login("user@example.com", "UserDemo123!");
    const response = await fetch(base + "/admin/users", {
      headers: { Cookie: cookieHeader(jar) }
    });

    expect(response.status).toBe(403);
  });

  it("exige CSRF en operaciones administrativas mutantes", async () => {
    const { jar } = await login("admin@example.com", "AdminDemo123!");

    const withoutToken = await post(
      "/admin/users",
      { email: "nuevo@example.com", role: "USER" },
      jar
    );
    expect(withoutToken.status).toBe(403);

    const withToken = await post(
      "/admin/users",
      { email: "nuevo@example.com", role: "USER" },
      jar,
      { "X-CSRF-Token": jar.csrf_token }
    );
    expect(withToken.status).toBe(201);
    expect((await withToken.json()).user.email).toBe("nuevo@example.com");

    const duplicate = await post(
      "/admin/users",
      { email: "nuevo@example.com", role: "USER" },
      jar,
      { "X-CSRF-Token": jar.csrf_token }
    );
    expect(duplicate.status).toBe(409);
  });

  it("emite un código de un solo uso y permite restablecer la contraseña", async () => {
    const { jar } = await login("admin@example.com", "AdminDemo123!");

    const usersResponse = await fetch(base + "/admin/users", {
      headers: { Cookie: cookieHeader(jar) }
    });
    const users = (await usersResponse.json()).users;
    const target = users.find((item) => item.email === "user@example.com");

    const issue = await post(
      "/admin/password-resets",
      { user_id: target.id },
      jar,
      { "X-CSRF-Token": jar.csrf_token }
    );
    expect(issue.status).toBe(201);
    const { code } = await issue.json();
    expect(code).toMatch(/^[A-F0-9]{8}$/);

    const firstUse = await post("/auth/reset-password", {
      email: "user@example.com",
      code,
      new_password: "NuevaClave123!"
    });
    expect(firstUse.status).toBe(204);

    const secondUse = await post("/auth/reset-password", {
      email: "user@example.com",
      code,
      new_password: "OtraClave123!"
    });
    expect(secondUse.status).toBe(400);

    const relogin = await login("user@example.com", "NuevaClave123!");
    expect(relogin.response.status).toBe(200);
  });

  it("responde igual en forgot-password exista o no la cuenta", async () => {
    const known = await post("/auth/forgot-password", {
      email: "user@example.com"
    });
    const unknown = await post("/auth/forgot-password", {
      email: "nadie@example.com"
    });

    expect(known.status).toBe(202);
    expect(unknown.status).toBe(202);
    expect(await known.json()).toEqual(await unknown.json());
  });

  it("revoca la sesión al cerrar sesión y al cambiar contraseña", async () => {
    const first = await login("user@example.com", "UserDemo123!");

    const logout = await post(
      "/auth/logout",
      {},
      first.jar,
      { "X-CSRF-Token": first.jar.csrf_token }
    );
    expect(logout.status).toBe(204);

    const afterLogout = await fetch(base + "/auth/me", {
      headers: { Cookie: cookieHeader(first.jar) }
    });
    expect(afterLogout.status).toBe(401);

    const second = await login("user@example.com", "UserDemo123!");
    const changed = await post(
      "/auth/change-password",
      {
        current_password: "UserDemo123!",
        new_password: "Cambiada123!"
      },
      second.jar,
      { "X-CSRF-Token": second.jar.csrf_token }
    );
    expect(changed.status).toBe(204);

    const oldPassword = await login("user@example.com", "UserDemo123!");
    expect(oldPassword.response.status).toBe(401);

    const newPassword = await login("user@example.com", "Cambiada123!");
    expect(newPassword.response.status).toBe(200);
  });
});
