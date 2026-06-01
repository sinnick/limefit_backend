// Helper de permisos por ROL (Feature 4.5 — ADITIVO)
// Funciones puras, sin dependencias de request.
// NO reemplaza la auth existente: puede() exige primero session.user.admin
// (la puerta del panel) y solo entonces refina por ROL.

export const ROLES = ["dueno", "admin", "entrenador", "recepcion", "usuario"];

// Jerarquía/capacidades por feature. Mapa de capacidad → roles permitidos.
export const PERMISOS = {
  membresias: ["dueno", "admin", "recepcion"], // ver/registrar pagos
  planes: ["dueno", "admin"],
  clases: ["dueno", "admin", "entrenador"],
  reservas_ver: ["dueno", "admin", "entrenador", "recepcion"],
  acceso: ["dueno", "admin", "recepcion"],
  anuncios: ["dueno", "admin"],
  roles: ["dueno"], // solo dueño asigna roles
};

// rol efectivo. ADITIVO de verdad: un admin SIN ROL asignado (o ROL legacy
// "usuario") se trata como "admin", para que los admins existentes NO pierdan
// acceso a las features de Fase 4 antes de migrar el campo ROL. Solo un ROL
// explícito menor (entrenador/recepcion) restringe; "dueno" es el máximo.
export function rolDe(session) {
  if (!session || !session.user) return "usuario";
  const rol = session.user.rol;
  if (rol && rol !== "usuario") return rol;
  return session.user.admin ? "admin" : "usuario";
}

// puede(session, "membresias") → boolean. dueno siempre true.
export function puede(session, capacidad) {
  if (!session || !session.user || !session.user.admin) return false; // ADITIVO: requiere admin
  const rol = rolDe(session);
  if (rol === "dueno") return true;
  const permitidos = PERMISOS[capacidad] || [];
  return permitidos.includes(rol);
}
