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
    return "Como ADMIN puedes consultar cuentas, crear usuarios autorizados y emitir códigos temporales de recuperación. El servidor valida el rol en cada operación; ocultar o mostrar botones no sustituye ese control.";
  }
  return "Tu rol no incluye la gestión de usuarios. Las acciones administrativas no se muestran y el servidor también debe rechazarlas.";
}
