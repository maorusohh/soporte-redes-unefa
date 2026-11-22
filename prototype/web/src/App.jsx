import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ChangePasswordPage from "./pages/ChangePasswordPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import RecoverPage from "./pages/RecoverPage.jsx";
import SessionPage from "./pages/SessionPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/login" replace />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="session" element={<SessionPage />} />
        <Route path="recover" element={<RecoverPage />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
