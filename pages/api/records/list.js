import dbConnect from "utils/mongoose";
import Record from "models/Record";
import { applyCors, readJsonBody, resolveGymId, normalizeDni } from "utils/mobile";

// Listar records de un socio por DNI (endpoint móvil de lectura). Unificado al
// patrón común de Fase 0 (CONTRACT-fase0.md §b): CORS+OPTIONS, readJsonBody y
// resolución de tenant por X-Brand.

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

    const result_records = await Record.find({ DNI: dniNum, GYM_ID });
    return res.status(200).json({ status: "ok", result_records });
  } catch (error) {
    console.log("RECORDS LIST ERROR:", error);
    return res.status(500).json({ status: "error", error: String((error && error.message) || error) });
  }
}
