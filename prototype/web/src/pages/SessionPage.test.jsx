import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../auth/AuthProvider.jsx";
import SessionPage from "./SessionPage.jsx";

const admin = { id: "admin-1", email: "admin@example.com", role: "ADMIN" };
const existingUser = {
  id: "user-1",
  email: "user@example.com",
  role: "USER",
  active: true
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/session"]}>
      <AuthProvider>
        <SessionPage />
      </AuthProvider>
    </MemoryRouter>
  );
}

beforeEach(() => {
  document.cookie = "csrf_token=token-admin; path=/";
});

afterEach(() => {
  document.cookie = "csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("SessionPage — administración", () => {
  it("lista, crea cuentas y emite un código temporal solo en pantalla", async () => {
    const created = {
      id: "user-2",
      email: "nuevo@example.com",
      role: "USER",
      active: true
    };

    const fetchMock = vi.fn((url, init = {}) => {
      const method = init.method || "GET";

      if (url.endsWith("/auth/me")) {
        return Promise.resolve(jsonResponse({ user: admin }));
      }
      if (url.endsWith("/admin/users") && method === "GET") {
        return Promise.resolve(jsonResponse({ users: [existingUser] }));
      }
      if (url.endsWith("/admin/users") && method === "POST") {
        return Promise.resolve(jsonResponse({ user: created }, 201));
      }
      if (url.endsWith("/admin/password-resets") && method === "POST") {
        return Promise.resolve(
          jsonResponse(
            { code: "CODIGO-1234", expires_at: "2026-11-23T12:15:00Z" },
            201
          )
        );
      }
      throw new Error(`Ruta no simulada: ${method} ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Administración de cuentas" })
      ).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "Consultar usuarios" }));

    await waitFor(() => {
      expect(screen.getByText("user@example.com")).toBeTruthy();
    });

    fireEvent.change(screen.getByLabelText("Correo de la nueva cuenta"), {
      target: { value: "nuevo@example.com" }
    });
    fireEvent.change(screen.getByLabelText("Rol de la nueva cuenta"), {
      target: { value: "USER" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => {
      expect(
        screen.getByText(/Cuenta creada: nuevo@example\.com/)
      ).toBeTruthy();
    });
    expect(screen.getByText("nuevo@example.com")).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Generar código para user@example.com"
      })
    );

    await waitFor(() => {
      expect(screen.getByText("CODIGO-1234")).toBeTruthy();
    });
    expect(screen.getByText(/Se muestra una sola vez/)).toBeTruthy();

    const createCall = fetchMock.mock.calls.find(
      ([url, init]) =>
        url.endsWith("/admin/users") && (init?.method || "GET") === "POST"
    );
    expect(createCall[1].headers["X-CSRF-Token"]).toBe("token-admin");
    expect(JSON.parse(createCall[1].body)).toEqual({
      email: "nuevo@example.com",
      role: "USER"
    });

    const resetCall = fetchMock.mock.calls.find(([url]) =>
      url.endsWith("/admin/password-resets")
    );
    expect(JSON.parse(resetCall[1].body)).toEqual({ user_id: "user-1" });
  });

  it("no muestra la sección administrativa a un USER", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url) => {
        if (url.endsWith("/auth/me")) {
          return Promise.resolve(
            jsonResponse({
              user: { id: "user-1", email: "user@example.com", role: "USER" }
            })
          );
        }
        throw new Error(`Ruta no simulada: ${url}`);
      })
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Tu sesión" })).toBeTruthy();
    });
    expect(screen.queryByRole("heading", { name: "Administración de cuentas" }))
      .toBeNull();
  });
});
