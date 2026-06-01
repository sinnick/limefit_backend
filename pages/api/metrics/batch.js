import dbConnect from "utils/mongoose";
import MetricaCorporal from "models/MetricaCorporal";
import { applyCors, readJsonBody, resolveGymId, normalizeDni } from "utils/mobile";

// Guardar métricas corporales (batch, idempotente) — POST /api/metrics/batch
// (CONTRACT-fase1.md §2.2, feature 1.3). Es el endpoint que consume la cola de
// sync para las métricas corporales.
//
// Idempotencia: cada métrica trae un `clientId` (UUID generado en la app). El
// backend hace upsert por (GYM_ID, DNI, CLIENT_ID): reenviar el mismo lote
// (reintento de red) NO duplica. Mismo patrón que records/batch.js.
//
// Errores parciales: si una métrica falla validación, su entrada en results[] va
// { ok: false, error } y el resto se procesa igual (no aborta el lote). HTTP 200.

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  try {
    if (await applyCors(req, res)) return; // preflight OPTIONS → 204

    await dbConnect();
    const GYM_ID = resolveGymId(req);

    const { dni, metrics } = await readJsonBody(req);
    const dniNum = normalizeDni(dni);
    if (dniNum === null) {
      return res.status(400).json({ status: "error", error: "DNI inválido" });
    }
    if (!Array.isArray(metrics)) {
      return res.status(400).json({ status: "error", error: "metrics debe ser un array" });
    }

    const results = [];

    for (const m of metrics) {
      const clientId = m && m.clientId;
      try {
        if (!clientId || typeof clientId !== "string") {
          results.push({ clientId: clientId ?? null, ok: false, error: "clientId requerido" });
          continue;
        }

        // Mapeo del body al modelo MetricaCorporal (CONTRACT-fase1.md §2.2):
        //   peso→PESO, porcentajeGrasa→PORCENTAJE_GRASA, fecha→FECHA,
        //   medidas→MEDIDAS, notas→NOTAS, clientId→CLIENT_ID.
        const doc = {
          DNI: dniNum,
          GYM_ID,
          CLIENT_ID: clientId,
          FECHA: m.fecha ? new Date(m.fecha) : undefined,
          PESO: m.peso,
          PORCENTAJE_GRASA: m.porcentajeGrasa,
          MEDIDAS: m.medidas,
          NOTAS: m.notas,
        };

        // Upsert idempotente por (GYM_ID, DNI, CLIENT_ID). `created` distingue
        // alta nueva de no-op (ya existía) — ambos cuentan como éxito.
        const updated = await MetricaCorporal.findOneAndUpdate(
          { GYM_ID, DNI: dniNum, CLIENT_ID: clientId },
          { $setOnInsert: doc },
          { upsert: true, new: true, includeResultMetadata: true }
        );

        const created = !!(updated.lastErrorObject && updated.lastErrorObject.upserted);
        results.push({
          clientId,
          ok: true,
          _id: String(updated.value._id),
          created,
        });
      } catch (itemError) {
        results.push({
          clientId: clientId ?? null,
          ok: false,
          error: String((itemError && itemError.message) || itemError),
        });
      }
    }

    return res.status(200).json({ status: "ok", results });
  } catch (error) {
    console.log("METRICS BATCH ERROR:", error);
    return res.status(500).json({ status: "error", error: String((error && error.message) || error) });
  }
}
