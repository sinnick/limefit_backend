import dbConnect from "utils/mongoose";
import Asistencia from "models/Asistencia";
import { applyCors, readJsonBody, resolveGymId, normalizeDni } from "utils/mobile";

// Historial de asistencias de un socio — POST /api/asistencia/list (CONTRACT-fase2 §2.5b).
// Lo consume la app (asistenciaApi.getHistorial / useAsistenciaQuery).
// Body: { dni, desde?, hasta?, limit?, skip? }. Respuesta: { status, asistencias, total }.
// Patrón móvil común: CORS+OPTIONS, readJsonBody, resolveGymId por X-Brand.

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  try {
    if (await applyCors(req, res)) return; // preflight OPTIONS → 204

    await dbConnect();
    const GYM_ID = resolveGymId(req);

    const { dni, desde, hasta, limit, skip } = await readJsonBody(req);
    const dniNum = normalizeDni(dni);
    if (dniNum === null) {
      return res.status(400).json({ status: "error", error: "DNI inválido" });
    }

    const filtro = { GYM_ID, DNI: dniNum };
    if (desde || hasta) {
      filtro.FECHA = {};
      if (desde) filtro.FECHA.$gte = new Date(desde);
      if (hasta) filtro.FECHA.$lte = new Date(hasta);
    }

    const lim = Math.min(Number(limit) > 0 ? Number(limit) : 100, 365);
    const sk = Number(skip) > 0 ? Number(skip) : 0;

    const [asistencias, total] = await Promise.all([
      Asistencia.find(filtro).sort({ FECHA: -1 }).skip(sk).limit(lim),
      Asistencia.countDocuments(filtro),
    ]);

    return res.status(200).json({ status: "ok", asistencias, total });
  } catch (error) {
    console.log("ASISTENCIA LIST ERROR:", error);
    return res.status(500).json({ status: "error", error: String((error && error.message) || error) });
  }
}
