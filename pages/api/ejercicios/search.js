import dbConnect from "utils/mongoose";
import Ejercicio from "models/Ejercicio";
import { applyCors, readJsonBody, resolveGymId } from "utils/mobile";

// Búsqueda/listado de ejercicios de la biblioteca — Feature 2.1
// (CONTRACT-fase2.md §2.1 "POST /api/ejercicios/search").
//
// Patrón común Fase 0/1: CORS+OPTIONS, readJsonBody (bodyParser off),
// resolución de tenant por X-Brand. Es lectura pública del gym: NO es
// offline-first, no usa CLIENT_ID ni idempotencia. Filtro siempre con
// GYM_ID resuelto y ACTIVO: true.
//
// Body (todos los filtros opcionales):
//   { query, grupoMuscular, dificultad, equipo, limit }
//   - query         → regex case-insensitive sobre NOMBRE
//   - grupoMuscular → GRUPO_MUSCULAR exacto
//   - dificultad    → DIFICULTAD exacto
//   - equipo        → EQUIPO exacto
//   - limit         → default 50, tope 100

export const config = { api: { bodyParser: false } };

// Escapa metacaracteres para usar `query` como literal dentro de la regex.
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default async function handler(req, res) {
  try {
    if (await applyCors(req, res)) return; // preflight OPTIONS → 204

    await dbConnect();
    const GYM_ID = resolveGymId(req);

    const body = await readJsonBody(req);
    const { query, grupoMuscular, dificultad, equipo } = body;

    // limit: default 50, tope 100; 400 si viene inválido.
    let limit = 50;
    if (body.limit !== undefined && body.limit !== null && body.limit !== "") {
      const n = Number(body.limit);
      if (!Number.isFinite(n) || n <= 0) {
        return res.status(400).json({ status: "error", error: "limit inválido" });
      }
      limit = Math.min(Math.floor(n), 100);
    }

    const filter = { GYM_ID, ACTIVO: true };
    if (query) filter.NOMBRE = { $regex: escapeRegex(query), $options: "i" };
    if (grupoMuscular) filter.GRUPO_MUSCULAR = grupoMuscular;
    if (dificultad) filter.DIFICULTAD = dificultad;
    if (equipo) filter.EQUIPO = equipo;

    const ejercicios = await Ejercicio.find(filter).sort({ NOMBRE: 1 }).limit(limit);

    return res.status(200).json({
      status: "ok",
      ejercicios,
      total: ejercicios.length,
    });
  } catch (error) {
    console.log("EJERCICIOS SEARCH ERROR:", error);
    return res.status(500).json({ status: "error", error: String((error && error.message) || error) });
  }
}
