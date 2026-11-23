import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef
} from "react";
import { authApi } from "../api/client.js";
import {
  initialSessionState,
  normalizeUser,
  sessionReducer
} from "../utils/session.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(sessionReducer, initialSessionState);
  const requestSequence = useRef(0);

  const nextRequestId = useCallback(() => {
    requestSequence.current += 1;
    return requestSequence.current;
  }, []);

  const refresh = useCallback(async () => {
    const requestId = nextRequestId();
    dispatch({ type: "REQUEST", requestId });

    try {
      const data = await authApi.me();
      const user = normalizeUser(data?.user, "/auth/me");
      dispatch({ type: "AUTHENTICATED", requestId, user });
      return user;
    } catch (error) {
      if (error?.status === 401) {
        dispatch({ type: "ANONYMOUS", requestId });
        return null;
      }
      dispatch({ type: "ERROR", requestId, error });
      return null;
    }
  }, [nextRequestId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (email, password) => {
      // Invalida cualquier /auth/me en curso antes de pedir el login.
      const requestId = nextRequestId();
      dispatch({ type: "INVALIDATE", requestId });

      try {
        const data = await authApi.login(email, password);
        const user = normalizeUser(data?.user, "/auth/login");
        dispatch({ type: "AUTHENTICATED", requestId, user });
        return user;
      } catch (error) {
        // Si el estado había quedado en "loading" por una comprobación
        // anterior, se recupera un estado conocido; el error se muestra en
        // el formulario de acceso.
        dispatch({ type: "ANONYMOUS", requestId });
        throw error;
      }
    },
    [nextRequestId]
  );

  const logout = useCallback(async () => {
    const requestId = nextRequestId();
    dispatch({ type: "INVALIDATE", requestId });

    await authApi.logout();
    dispatch({ type: "ANONYMOUS", requestId });
  }, [nextRequestId]);

  const clearSession = useCallback(() => {
    const requestId = nextRequestId();
    dispatch({ type: "ANONYMOUS", requestId });
  }, [nextRequestId]);

  const value = useMemo(
    () => ({
      status: state.status,
      user: state.user,
      error: state.error,
      refresh,
      login,
      logout,
      clearSession
    }),
    [state.status, state.user, state.error, refresh, login, logout, clearSession]
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
