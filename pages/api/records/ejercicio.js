import dbConnect from "utils/mongoose";
import Record from "models/Record";
import { applyCors, readJsonBody, resolveGymId, normalizeDni } from "utils/mobile";

// Listar los records de un socio para UN ejercicio concreto — POST /api/records/ejercicio.
// Endpoint móvil de lectura que consume la app (recordsApi.getByEjercicio →
// useRecordByEjercicio). Body: { dni, ejercicioId }. Respuesta: { records: [...] }
// (clave `records`, distinta de /records/list que usa `result_records`).
// Sigue el patrón común de Fase 0 (CONTRACT-fase0.md §b): CORS+OPTIONS,
// readJsonBody y resolución de tenant por X-Brand.

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  try {
    if (await applyCors(req, res)) return; // preflight OPTIONS → 204

    await dbConnect();
    const GYM_ID = resolveGymId(req);

    const { dni, ejercicioId } = await readJsonBody(req);
    const dniNum = normalizeDni(dni);
    if (dniNum === null) {
      return res.status(400).json({ status: "error", error: "DNI inválido" });
    }
    if (!ejercicioId || typeof ejercicioId !== "string") {
      return res.status(400).json({ status: "error", error: "ejercicioId requerido" });
    }

    // Más reciente primero, para que la app muestre la progresión del PR.
    const records = await Record.find({
      DNI: dniNum,
      GYM_ID,
      EJERCICIO_ID: ejercicioId,
    }).sort({ FECHA: -1 });

    return res.status(200).json({ status: "ok", records });
  } catch (error) {
    console.log("RECORDS EJERCICIO ERROR:", error);
    return res.status(500).json({ status: "error", error: String((error && error.message) || error) });
  }
}
