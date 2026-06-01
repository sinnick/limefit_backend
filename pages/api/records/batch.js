import dbConnect from "utils/mongoose";
import Record from "models/Record";
import { applyCors, readJsonBody, resolveGymId, normalizeDni } from "utils/mobile";

// Guardar records (batch, idempotente) — POST /api/records/batch
// (CONTRACT-fase0.md §b.3). Es el endpoint que consume la cola de sync para
// records/PRs.
//
// Idempotencia: cada record trae un `clientId` (UUID generado en la app). El
// backend hace upsert por (GYM_ID, DNI, CLIENT_ID): reenviar el mismo lote
// (reintento de red) NO duplica.
//
// Errores parciales: si un record falla validación, su entrada en results[] va
// { ok: false, error } y el resto se procesa igual (no aborta el lote). HTTP 200.

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  try {
    if (await applyCors(req, res)) return; // preflight OPTIONS → 204

    await dbConnect();
    const GYM_ID = resolveGymId(req);

    const { dni, records } = await readJsonBody(req);
    const dniNum = normalizeDni(dni);
    if (dniNum === null) {
      return res.status(400).json({ status: "error", error: "DNI inválido" });
    }
    if (!Array.isArray(records)) {
      return res.status(400).json({ status: "error", error: "records debe ser un array" });
    }

    const results = [];

    for (const r of records) {
      const clientId = r && r.clientId;
      try {
        if (!clientId || typeof clientId !== "string") {
          results.push({ clientId: clientId ?? null, ok: false, error: "clientId requerido" });
          continue;
        }

        // Mapeo del body al modelo Record (CONTRACT-fase0.md §b.3):
        //   ejercicioId→EJERCICIO_ID, ejercicioNombre→EJERCICIO, peso→PESO,
        //   reps→REPS, fecha→FECHA, notas→NOTAS, esRecord→ES_RECORD,
        //   clientId→CLIENT_ID.
        const doc = {
          DNI: dniNum,
          GYM_ID,
          CLIENT_ID: clientId,
          EJERCICIO_ID: r.ejercicioId,
          EJERCICIO: r.ejercicioNombre,
          PESO: r.peso,
          REPS: r.reps,
          FECHA: r.fecha ? new Date(r.fecha) : undefined,
          NOTAS: r.notas,
          ES_RECORD: r.esRecord,
        };

        // Upsert idempotente por (GYM_ID, DNI, CLIENT_ID). `created` distingue
        // alta nueva de no-op (ya existía) — ambos cuentan como éxito.
        const updated = await Record.findOneAndUpdate(
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
    console.log("RECORDS BATCH ERROR:", error);
    return res.status(500).json({ status: "error", error: String((error && error.message) || error) });
  }
}
