import dbConnect from "utils/mongoose";
import MetricaCorporal from "models/MetricaCorporal";
import { applyCors, readJsonBody, resolveGymId, normalizeDni } from "utils/mobile";

// Listar métricas corporales de un socio por DNI (endpoint móvil de lectura) —
// POST /api/metrics/list (CONTRACT-fase1.md §2.2, feature 1.3). Mismo patrón
// común de Fase 0: CORS+OPTIONS, readJsonBody y resolución de tenant por X-Brand.
// Devuelve documentos crudos en MAYÚSCULAS; la app los adapta a camelCase.

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

    const metrics = await MetricaCorporal.find({ DNI: dniNum, GYM_ID }).sort({ FECHA: -1 });
    return res.status(200).json({ status: "ok", metrics });
  } catch (error) {
    console.log("METRICS LIST ERROR:", error);
    return res.status(500).json({ status: "error", error: String((error && error.message) || error) });
  }
}
