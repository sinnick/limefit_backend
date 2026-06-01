import dbConnect from "utils/mongoose";
import Clase from "models/Clase";
import Reserva from "models/Reserva";
import { applyCors, readJsonBody, resolveGymId, normalizeDni } from "utils/mobile";

// Reservas activas del socio — POST /api/clases/mis-reservas
// (CONTRACT-fase4.md §3.5 / Feature 4.3).
// Devuelve solo las reservas ESTADO "reservada" del socio, con nombre/hora de la
// clase. Proyección segura: no expone GYM_ID ni datos de otros tenants.

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

    const reservas = await Reserva.find({
      GYM_ID,
      DNI: dniNum,
      ESTADO: "reservada",
    }).sort({ FECHA: -1 });

    const data = await Promise.all(
      reservas.map(async (reserva) => {
        const clase = await Clase.findOne({ _id: reserva.CLASE_ID, GYM_ID }).select(
          "NOMBRE INSTRUCTOR DIA_SEMANA HORA"
        );
        return {
          reservaId: reserva._id,
          claseId: reserva.CLASE_ID,
          FECHA: reserva.FECHA,
          estado: reserva.ESTADO,
          clase: clase
            ? {
                NOMBRE: clase.NOMBRE,
                INSTRUCTOR: clase.INSTRUCTOR,
                DIA_SEMANA: clase.DIA_SEMANA,
                HORA: clase.HORA,
              }
            : null,
        };
      })
    );

    return res.status(200).json({ status: "ok", data });
  } catch (error) {
    console.log("CLASES MIS-RESERVAS ERROR:", error);
    return res.status(500).json({ status: "error", error: String((error && error.message) || error) });
  }
}
