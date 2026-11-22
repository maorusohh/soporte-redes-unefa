import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/login", label: "Acceso" },
  { to: "/recover", label: "Recuperación" },
  { to: "/session", label: "Sesión" },
  { to: "/change-password", label: "Cambio de contraseña" }
];

export default function Layout() {
  return (
    <>
      <a className="skip-link" href="#contenido">
        Ir al contenido
      </a>

      <header className="site-header">
        <div className="brand">
          Soporte técnico y monitoreo
          <small>Prototipo FRONT-002 · datos ficticios</small>
        </div>
        <nav className="site-nav" aria-label="Pantallas del prototipo">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main id="contenido">
        <Outlet />
      </main>

      <footer className="site-footer">
        <p>
          Prototipo académico. Usa únicamente correos y datos ficticios. No
          introduzcas credenciales reales sin HTTPS/TLS.
        </p>
      </footer>
    </>
  );
}
