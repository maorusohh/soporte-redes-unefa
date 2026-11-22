export function roleLabel(role) {
  if (role === "ADMIN") {
    return "Administrador";
  }
  if (role === "USER") {
    return "Usuario";
  }
  return role || "Sin rol";
}

export function roleDescription(role) {
  if (role === "ADMIN") {
    return "Como ADMIN puedes consultar la lista de usuarios autorizados. Las operaciones de escritura siguen pendientes en Backend.";
  }
  return "Tu rol no incluye la gestión de usuarios. Las acciones administrativas no se muestran y el servidor también debe rechazarlas.";
}
