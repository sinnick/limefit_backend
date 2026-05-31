import dbConnect from "utils/mongoose";
import Membresia from "models/Membresia";
import { applyCors, readJsonBody, resolveGymId, normalizeDni } from "utils/mobile";
import { calcularEstadoCuota } from "utils/membresias";

// Estado de cuota del socio (Feature 4.1, CONTRACT-fase4.md §3.1). POST.
// Proyección SEGURA: nunca expone el array PAGOS ni montos al socio.
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

    const membresia = await Membresia.findOne({ GYM_ID, DNI: dniNum }).lean();

    if (!membresia) {
      return res.status(200).json({ status: "ok", data: { tieneMembresia: false } });
    }

    const { estadoCuota, diasRestantes } = calcularEstadoCuota(membresia);

    return res.status(200).json({
      status: "ok",
      data: {
        tieneMembresia: true,
        estado: estadoCuota,
        planNombre: membresia.PLAN_NOMBRE || "",
        fechaInicio: membresia.FECHA_INICIO,
        fechaFin: membresia.FECHA_FIN,
        diasRestantes,
      },
    });
  } catch (error) {
    console.log("MEMBRESIA STATUS ERROR:", error);
    return res.status(500).json({ status: "error", error: String((error && error.message) || error) });
  }
}
