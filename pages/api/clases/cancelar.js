import dbConnect from "utils/mongoose";
import Clase from "models/Clase";
import Reserva from "models/Reserva";
import { applyCors, readJsonBody, resolveGymId, normalizeDni } from "utils/mobile";

// Cancelar una reserva — POST (o DELETE) /api/clases/cancelar
// (CONTRACT-fase4.md §3.4 / Feature 4.3).
// NO borra el doc: marca ESTADO "cancelada" para liberar cupo conservando el
// histórico. Resuelve la reserva por (GYM_ID, DNI, CLASE_ID, FECHA).

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

    // FECHA del dictado: la enviada (a medianoche UTC) o el próximo dictado de la clase.
    let FECHA;
    if (fecha) {
      FECHA = medianocheUTC(fecha);
    } else {
      const clase = await Clase.findOne({ _id: claseId, GYM_ID });
      if (!clase) {
        return res.status(404).json({ status: "error", error: "Clase no encontrada" });
      }
      FECHA = proximoDictadoUTC(clase.DIA_SEMANA);
    }

    const reserva = await Reserva.findOneAndUpdate(
      { GYM_ID, DNI: dniNum, CLASE_ID: claseId, FECHA },
      { $set: { ESTADO: "cancelada" } },
      { new: true }
    );

    if (!reserva) {
      return res.status(404).json({ status: "error", error: "Reserva no encontrada" });
    }

    return res.status(200).json({ status: "ok", data: { estado: "cancelada" } });
  } catch (error) {
    console.log("CLASES CANCELAR ERROR:", error);
    return res.status(500).json({ status: "error", error: String((error && error.message) || error) });
  }
}
