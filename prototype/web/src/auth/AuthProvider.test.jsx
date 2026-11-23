import { useState } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthProvider.jsx";

const admin = { id: "u1", email: "admin@example.com", role: "ADMIN" };

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function Probe() {
  const auth = useAuth();
  const [loginError, setLoginError] = useState("");

  return (
    <div>
      <span data-testid="status">{auth.status}</span>
      <span data-testid="email">{auth.user?.email || ""}</span>
      <span data-testid="error-status">{auth.error?.status ?? ""}</span>
      <span data-testid="login-error">{loginError}</span>
      <button
        type="button"
        onClick={() => {
          auth
            .login("admin@example.com", "secreto-sintetico")
            .catch((error) => setLoginError(String(error?.status)));
        }}
      >
        Entrar
      </button>
      <button type="button" onClick={() => auth.logout()}>
        Salir
      </button>
      <button type="button" onClick={() => auth.refresh()}>
        Reintentar
      </button>
    </div>
  );
}

function renderProvider() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("AuthProvider", () => {
  it("no deja que un /auth/me lento sobrescriba un login exitoso", async () => {
    const slowMe = deferred();
    const fetchMock = vi.fn((url) => {
      if (url.endsWith("/auth/me")) {
        return slowMe.promise;
      }
      if (url.endsWith("/auth/login")) {
        return Promise.resolve(jsonResponse({ user: admin }));
      }
      throw new Error(`Ruta no simulada: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    renderProvider();
    expect(screen.getByTestId("status").textContent).toBe("loading");

    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("authenticated");
    });
    expect(screen.getByTestId("email").textContent).toBe(admin.email);

    await act(async () => {
      slowMe.resolve(jsonResponse({ detail: "Sesión no válida" }, 401));
      await slowMe.promise;
    });

    expect(screen.getByTestId("status").textContent).toBe("authenticated");
    expect(screen.getByTestId("email").textContent).toBe(admin.email);
  });

  it("ignora un error de red obsoleto después del login", async () => {
    const slowMe = deferred();
    vi.stubGlobal(
      "fetch",
      vi.fn((url) => {
        if (url.endsWith("/auth/me")) {
          return slowMe.promise;
        }
        return Promise.resolve(jsonResponse({ user: admin }));
      })
    );

    renderProvider();
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("authenticated");
    });

    await act(async () => {
      slowMe.reject(new TypeError("fallo de red viejo"));
      await slowMe.promise.catch(() => {});
    });

    expect(screen.getByTestId("status").textContent).toBe("authenticated");
  });

  it("pasa a anónimo cuando /auth/me responde 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ detail: "No autenticado" }, 401))
    );

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("anonymous");
    });
  });

  it("expone el error cuando /auth/me falla por el servidor", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ detail: "Fallo interno" }, 500))
    );

    renderProvider();

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("error");
    });
    expect(screen.getByTestId("error-status").textContent).toBe("500");
  });

  it("rechaza un usuario con rol fuera del contrato sin autenticarlo", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() =>
        Promise.resolve(
          jsonResponse({
            user: { id: "u9", email: "raro@example.com", role: "ROOT" }
          })
        )
      )
    );

    renderProvider();
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(screen.getByTestId("login-error").textContent).toBe("500");
    });
    expect(screen.getByTestId("status").textContent).toBe("anonymous");
    expect(screen.getByTestId("email").textContent).toBe("");
  });

  it("limpia la sesión después de logout confirmado", async () => {
    const fetchMock = vi.fn((url) => {
      if (url.endsWith("/auth/me")) {
        return Promise.resolve(jsonResponse({ user: admin }));
      }
      if (url.endsWith("/auth/logout")) {
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      throw new Error(`Ruta no simulada: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    renderProvider();
    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("authenticated");
    });

    fireEvent.click(screen.getByRole("button", { name: "Salir" }));

    await waitFor(() => {
      expect(screen.getByTestId("status").textContent).toBe("anonymous");
    });
    expect(
      fetchMock.mock.calls.some(([url]) => url.endsWith("/auth/logout"))
    ).toBe(true);
  });
});
