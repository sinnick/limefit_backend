// Helpers puros de membresías (Feature 4.1, CONTRACT-fase4.md §4).
// La verdad operativa del estado de cuota es FECHA_FIN vs hoy; el campo
// persistido ESTADO es informativo, salvo "suspendida" que es override manual
// y gana sobre el cálculo por fecha.

const MS_POR_DIA = 24 * 60 * 60 * 1000;

// §4.1 — FECHA_FIN al asignar/renovar: FECHA_INICIO + DURACION_DIAS.
export function calcularFechaFin(fechaInicio, duracionDias) {
  const inicio = fechaInicio instanceof Date ? fechaInicio : new Date(fechaInicio);
  return new Date(inicio.getTime() + Number(duracionDias) * MS_POR_DIA);
}

// §4.2 — Estado de cuota (al día / vencido / suspendida) por FECHA_FIN.
// Devuelve { estadoCuota, diasRestantes }. diasRestantes es negativo si venció.
export function calcularEstadoCuota(membresia, ahora = new Date()) {
  if (!membresia || !membresia.FECHA_FIN) {
    return { estadoCuota: "vencido", diasRestantes: 0 };
  }
  const fechaFin = membresia.FECHA_FIN instanceof Date
    ? membresia.FECHA_FIN
    : new Date(membresia.FECHA_FIN);
  const diasRestantes = Math.ceil((fechaFin.getTime() - ahora.getTime()) / MS_POR_DIA);

  if (membresia.ESTADO === "suspendida") {
    // Override manual del admin: gana sobre el cálculo por fecha.
    return { estadoCuota: "suspendida", diasRestantes };
  }
  if (fechaFin.getTime() >= ahora.getTime()) {
    return { estadoCuota: "al_dia", diasRestantes };
  }
  return { estadoCuota: "vencido", diasRestantes };
}
