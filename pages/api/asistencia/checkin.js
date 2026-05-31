import dbConnect from "utils/mongoose";
import Asistencia from "models/Asistencia";
import { applyCors, readJsonBody, resolveGymId, normalizeDni } from "utils/mobile";

// Check-in de asistencia (idempotente por DNI+gym+día) — POST /api/asistencia/checkin
// (CONTRACT-fase2.md §2.5). Es el endpoint que consume la cola de sync para
// asistencias (syncQueue type 'asistencia').
//
// Idempotencia (doble candado):
//   1. La FECHA se normaliza a medianoche UTC (Date.UTC(y,m,d)).
//   2. findOneAndUpdate por (GYM_ID, DNI, FECHA) con upsert: un solo check-in por
//      DNI+gym+día. Reintentos del mismo día NO crean doc nuevo (created:false);
//      sólo refrescan HORA_CHECKIN/METODO. El CLIENT_ID/NOTAS/FECHA se fijan en el
//      alta inicial ($setOnInsert).
//
// created = !!updated.lastErrorObject?.upserted (true = alta nueva, false = ya existía).

export const config = { api: { bodyParser: false } };

const METODOS = ["qr", "dni", "manual"];

export default async function handler(req, res) {
  try {
    if (await applyCors(req, res)) return; // preflight OPTIONS → 204

    await dbConnect();
    const GYM_ID = resolveGymId(req);

    const { dni, metodo, clientId, notas, fecha } = await readJsonBody(req);
    const dniNum = normalizeDni(dni);
    if (dniNum === null) {
      return res.status(400).json({ status: "error", error: "DNI inválido" });
    }

    // metodo ∈ qr|dni|manual (default qr); cualquier otro valor cae a qr.
    const metodoNorm = METODOS.includes(metodo) ? metodo : "qr";

    // Hora real del check-in (default now); FECHA = medianoche UTC de ese día.
    const horaCheckin = fecha ? new Date(fecha) : new Date();
    const dia = new Date(
      Date.UTC(
        horaCheckin.getUTCFullYear(),
        horaCheckin.getUTCMonth(),
        horaCheckin.getUTCDate()
      )
    );

    // $setOnInsert fija identidad/inmutables del alta; $set refresca la última
    // hora/método (CONTRACT-fase2.md §2.5). No se pueden solapar campos entre
    // ambos operadores, así que HORA_CHECKIN/METODO van sólo en $set.
    const onInsert = {
      DNI: dniNum,
      GYM_ID,
      FECHA: dia,
      CLIENT_ID: typeof clientId === "string" ? clientId : undefined,
      NOTAS: notas,
    };

    // Upsert idempotente por (GYM_ID, DNI, FECHA): un único check-in por día.
    const updated = await Asistencia.findOneAndUpdate(
      { GYM_ID, DNI: dniNum, FECHA: dia },
      { $setOnInsert: onInsert, $set: { HORA_CHECKIN: horaCheckin, METODO: metodoNorm } },
      { upsert: true, new: true, includeResultMetadata: true }
    );

    const created = !!(updated.lastErrorObject && updated.lastErrorObject.upserted);

    return res.status(200).json({
      status: "ok",
      asistencia: updated.value,
      created,
    });
  } catch (error) {
    console.log("ASISTENCIA CHECKIN ERROR:", error);
    return res.status(500).json({ status: "error", error: String((error && error.message) || error) });
  }
}
