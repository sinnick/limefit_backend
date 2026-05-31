import dbConnect from "utils/mongoose";
import WorkoutCompletado from "models/WorkoutCompletado";
import { applyCors, readJsonBody, resolveGymId, normalizeDni } from "utils/mobile";

// Guardar workouts completados (batch, idempotente) — POST /api/workouts/batch
// (CONTRACT-fase0.md §b.4). Persiste el historial de entrenamientos que hoy vive
// sólo en MMKV en la app.
//
// Idempotencia: cada workout trae un `clientId` (la app reusa el
// WorkoutCompletado.id que ya genera con generarId()). Upsert por
// (GYM_ID, DNI, CLIENT_ID); reenviar = no-op.
//
// Errores parciales: mismo patrón que records (results[] por clientId). HTTP 200.

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  try {
    if (await applyCors(req, res)) return; // preflight OPTIONS → 204

    await dbConnect();
    const GYM_ID = resolveGymId(req);

    const { dni, workouts } = await readJsonBody(req);
    const dniNum = normalizeDni(dni);
    if (dniNum === null) {
      return res.status(400).json({ status: "error", error: "DNI inválido" });
    }
    if (!Array.isArray(workouts)) {
      return res.status(400).json({ status: "error", error: "workouts debe ser un array" });
    }

    const results = [];

    for (const w of workouts) {
      const clientId = w && w.clientId;
      try {
        if (!clientId || typeof clientId !== "string") {
          results.push({ clientId: clientId ?? null, ok: false, error: "clientId requerido" });
          continue;
        }

        // Mapeo del body al modelo WorkoutCompletado (CONTRACT-fase0.md §b.4).
        // Los subdocumentos de ejercicios/sets ya usan camelCase y casan 1:1 con
        // el body, así que se asignan tal cual.
        const ejercicios = Array.isArray(w.ejercicios)
          ? w.ejercicios.map((e) => ({
              ejercicioId: e.ejercicioId,
              nombre: e.nombre,
              setsObjetivo: e.setsObjetivo,
              repsObjetivo: e.repsObjetivo,
              pesoObjetivo: e.pesoObjetivo,
              completado: e.completado,
              setsCompletados: Array.isArray(e.setsCompletados)
                ? e.setsCompletados.map((s) => ({
                    setNumero: s.setNumero,
                    peso: s.peso,
                    reps: s.reps,
                    completado: s.completado,
                    timestamp: s.timestamp ? new Date(s.timestamp) : undefined,
                    esRecord: s.esRecord,
                  }))
                : [],
            }))
          : [];

        const doc = {
          DNI: dniNum,
          GYM_ID,
          CLIENT_ID: clientId,
          RUTINA_ID: w.rutinaId !== undefined && w.rutinaId !== null ? String(w.rutinaId) : undefined,
          RUTINA_NOMBRE: w.rutinaNombre,
          DIA_ID: w.diaId,
          DIA_NOMBRE: w.diaNombre,
          FECHA: w.fecha ? new Date(w.fecha) : undefined,
          DURACION: w.duracion,
          VOLUMEN_TOTAL: w.volumenTotal,
          PRS_LOGRADOS: w.prsLogrados,
          NOTAS: w.notas,
          EJERCICIOS: ejercicios,
        };

        // Upsert idempotente por (GYM_ID, DNI, CLIENT_ID).
        const updated = await WorkoutCompletado.findOneAndUpdate(
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
    console.log("WORKOUTS BATCH ERROR:", error);
    return res.status(500).json({ status: "error", error: String((error && error.message) || error) });
  }
}
