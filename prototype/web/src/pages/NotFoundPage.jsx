import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="page page--narrow">
      <section className="card">
        <p className="eyebrow">Navegación</p>
        <h1>Pantalla no encontrada</h1>
        <p>La dirección solicitada no existe en este prototipo.</p>
        <p className="button-row">
          <Link className="button" to="/login">
            Ir al acceso
          </Link>
        </p>
      </section>
    </div>
  );
}
