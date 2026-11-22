import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { ApiError, authApi } from "../api/client.js";

const AuthContext = createContext(null);

const initialState = {
  status: "loading",
  user: null,
  error: null
};

export function AuthProvider({ children }) {
  const [state, setState] = useState(initialState);

  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, status: "loading", error: null }));

    try {
      const data = await authApi.me();
      if (!data?.user) {
        throw new ApiError(500, "Respuesta inesperada de /auth/me");
      }
      setState({ status: "authenticated", user: data.user, error: null });
      return data.user;
    } catch (error) {
      if (error?.status === 401) {
        setState({ status: "anonymous", user: null, error: null });
        return null;
      }
      setState({ status: "error", user: null, error });
      return null;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    if (!data?.user) {
      throw new ApiError(500, "Respuesta inesperada de /auth/login");
    }
    setState({ status: "authenticated", user: data.user, error: null });
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setState({ status: "anonymous", user: null, error: null });
  }, []);

  const clearSession = useCallback(() => {
    setState({ status: "anonymous", user: null, error: null });
  }, []);

  const value = useMemo(
    () => ({ ...state, refresh, login, logout, clearSession }),
    [state, refresh, login, logout, clearSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
