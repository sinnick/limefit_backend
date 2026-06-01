import dbConnect from "utils/mongoose";
import Rutina from "models/Rutina";
import UsuarioRutina from "models/UsuarioRutina";
import { applyCors, readJsonBody, resolveGymId, normalizeDni } from "utils/mobile";

// Mis rutinas asignadas — POST /api/mis-rutinas (CONTRACT-fase0.md §b.2).
// Devuelve SOLO las rutinas asignadas y activas del socio (no todas las del gym),
// ya con la estructura anidada DIAS[].ejercicios[]. La app pasa cada elemento por
// adaptRutina; se conserva la clave de respuesta `result_rutinas`.

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  try {
    if (await applyCors(req, res)) return; // preflight OPTIONS → 204

    await dbConnect();
    const GYM_ID = resolveGymId(req);

    const { dni } = await readJsonBody(req);
    const dniNum = normalizeDni(dni);
    if (dniNum === null) {
      return res.status(400).json({ status: "error", error: "DNI inválido" });
    }

    // 1) Asignaciones activas del socio en este tenant.
    const asignaciones = await UsuarioRutina.find({
      DNI: dniNum,
      GYM_ID,
      ACTIVA: true,
    });

    if (!asignaciones.length) {
      return res.status(200).json({ status: "ok", result_rutinas: [] });
    }

    // 2) IDs de rutina asignadas.
    const rutinaIds = asignaciones.map((a) => a.RUTINA_ID);

    // 3) Rutinas habilitadas que matchean (scoped a tenant).
    const rutinas = await Rutina.find({
      ID: { $in: rutinaIds },
      GYM_ID,
      HABILITADA: true,
    }).lean();

    // 4) Adjuntar metadata de la asignación por rutina (vigencia).
    const asignacionPorRutinaId = new Map();
    for (const a of asignaciones) {
      // Si hay varias activas para la misma rutina, nos quedamos con la primera.
      if (!asignacionPorRutinaId.has(a.RUTINA_ID)) {
        asignacionPorRutinaId.set(a.RUTINA_ID, a);
      }
    }

    const result_rutinas = rutinas.map((r) => {
      const a = asignacionPorRutinaId.get(r.ID);
      return {
        ...r,
        _asignacion: a
          ? {
              ACTIVA: a.ACTIVA,
              FECHA_INICIO: a.FECHA_INICIO,
              FECHA_FIN: a.FECHA_FIN,
              NOTAS: a.NOTAS || "",
            }
          : undefined,
      };
    });

    return res.status(200).json({ status: "ok", result_rutinas });
  } catch (error) {
    console.log("MIS-RUTINAS ERROR:", error);
    return res.status(500).json({ status: "error", error: String((error && error.message) || error) });
  }
}
