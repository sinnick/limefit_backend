import dbConnect from "utils/mongoose";
import Clase from "models/Clase";
import Reserva from "models/Reserva";
import { applyCors, readJsonBody, resolveGymId, normalizeDni } from "utils/mobile";

// Reservar una clase — POST /api/clases/reservar
// (CONTRACT-fase4.md §3.3 / Feature 4.3).
// Control de cupo (§4.3): cupoOcupado < CUPO. Idempotente y respeta el índice
// único (GYM_ID, DNI, CLASE_ID, FECHA): si existe cancelada, la reactiva; si ya
// está reservada, devuelve OK sin duplicar. Las canceladas no cuentan al cupo.

export const config = { api: { bodyParser: false } };

const DIAS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

function proximoDictadoUTC(diaSemana) {
  const target = DIAS.indexOf(diaSemana);
  const hoy = new Date();
  const base = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()));
  if (target < 0) return base;
  const diff = (target - base.getUTCDay() + 7) % 7;
  return new Date(base.getTime() + diff * 24 * 60 * 60 * 1000);
}

function medianocheUTC(fecha) {
  const d = new Date(fecha);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export default async function handler(req, res) {
  try {
    if (await applyCors(req, res)) return; // preflight OPTIONS → 204

    await dbConnect();
    const GYM_ID = resolveGymId(req);

    const { dni, claseId, fecha } = await readJsonBody(req);
    const dniNum = normalizeDni(dni);
    if (dniNum === null) {
      return res.status(400).json({ status: "error", error: "DNI inválido" });
    }
    if (!claseId) {
      return res.status(400).json({ status: "error", error: "Falta claseId" });
    }

    const clase = await Clase.findOne({ _id: claseId, GYM_ID, ACTIVA: true });
    if (!clase) {
      return res.status(404).json({ status: "error", error: "Clase no encontrada" });
    }

    // FECHA del dictado: la enviada (a medianoche UTC) o el próximo dictado.
    const FECHA = fecha ? medianocheUTC(fecha) : proximoDictadoUTC(clase.DIA_SEMANA);

    // ¿La reserva del socio ya existe (reservada)? → idempotente OK.
    const propia = await Reserva.findOne({ GYM_ID, DNI: dniNum, CLASE_ID: claseId, FECHA });
    if (propia && propia.ESTADO === "reservada") {
      return res.status(200).json({
        status: "ok",
        data: { reservaId: propia._id, estado: "reservada" },
      });
    }

    // Control de cupo (§4.3): solo cuentan las reservadas de ese dictado.
    const cupoOcupado = await Reserva.countDocuments({
      GYM_ID,
      CLASE_ID: claseId,
      FECHA,
      ESTADO: "reservada",
    });
    if (cupoOcupado >= clase.CUPO) {
      return res.status(409).json({ status: "error", error: "Sin cupo" });
    }

    // Upsert respetando índice único (GYM_ID, DNI, CLASE_ID, FECHA): reactiva
    // una cancelada o crea nueva como reservada.
    const reserva = await Reserva.findOneAndUpdate(
      { GYM_ID, DNI: dniNum, CLASE_ID: claseId, FECHA },
      {
        $set: { ESTADO: "reservada" },
        $setOnInsert: {
          GYM_ID,
          DNI: dniNum,
          CLASE_ID: claseId,
          FECHA,
          FECHA_CREACION: new Date(),
        },
      },
      { upsert: true, new: true, includeResultMetadata: true }
    );

    const doc = reserva.value;
    const created = !!(reserva.lastErrorObject && reserva.lastErrorObject.upserted);

    return res.status(created ? 201 : 200).json({
      status: "ok",
      data: { reservaId: doc._id, estado: "reservada" },
    });
  } catch (error) {
    console.log("CLASES RESERVAR ERROR:", error);
    return res.status(500).json({ status: "error", error: String((error && error.message) || error) });
  }
}
