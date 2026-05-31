import dbConnect from "utils/mongoose";
import Clase from "models/Clase";
import Reserva from "models/Reserva";
import { applyCors, readJsonBody, resolveGymId, normalizeDni } from "utils/mobile";

// Listar clases activas con cupo — GET o POST /api/clases/list
// (CONTRACT-fase4.md §3.2 / Feature 4.3).
// Devuelve solo clases ACTIVA:true con cupoOcupado/cupoDisponible del próximo
// dictado. Opcionalmente, si llega dni, marca yaReservada por clase.
// Proyección segura: nunca expone GYM_ID interno ni datos de otros tenants.

export const config = { api: { bodyParser: false } };

const DIAS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

// Medianoche UTC del próximo dictado de una clase (incluye hoy).
function proximoDictadoUTC(diaSemana) {
  const target = DIAS.indexOf(diaSemana);
  const hoy = new Date();
  const base = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()));
  if (target < 0) return base;
  const diff = (target - base.getUTCDay() + 7) % 7;
  return new Date(base.getTime() + diff * 24 * 60 * 60 * 1000);
}

export default async function handler(req, res) {
  try {
    if (await applyCors(req, res)) return; // preflight OPTIONS → 204

    await dbConnect();
    const GYM_ID = resolveGymId(req);

    // dni opcional (body en POST, query en GET) para marcar yaReservada.
    let dni;
    if (req.method === "POST") {
      const body = await readJsonBody(req);
      dni = body.dni;
    } else {
      dni = req.query.dni;
    }
    const dniNum = normalizeDni(dni);

    const clases = await Clase.find({ GYM_ID, ACTIVA: true }).sort({ DIA_SEMANA: 1, HORA: 1 });

    const data = await Promise.all(
      clases.map(async (clase) => {
        const fecha = proximoDictadoUTC(clase.DIA_SEMANA);
        const cupoOcupado = await Reserva.countDocuments({
          GYM_ID,
          CLASE_ID: clase._id,
          FECHA: fecha,
          ESTADO: "reservada",
        });

        let yaReservada;
        if (dniNum !== null) {
          const propia = await Reserva.findOne({
            GYM_ID,
            DNI: dniNum,
            CLASE_ID: clase._id,
            FECHA: fecha,
            ESTADO: "reservada",
          });
          yaReservada = !!propia;
        }

        return {
          _id: clase._id,
          NOMBRE: clase.NOMBRE,
          INSTRUCTOR: clase.INSTRUCTOR,
          DIA_SEMANA: clase.DIA_SEMANA,
          HORA: clase.HORA,
          CUPO: clase.CUPO,
          cupoOcupado,
          cupoDisponible: clase.CUPO - cupoOcupado,
          proximoDictado: fecha,
          ...(dniNum !== null ? { yaReservada } : {}),
        };
      })
    );

    return res.status(200).json({ status: "ok", data });
  } catch (error) {
    console.log("CLASES LIST ERROR:", error);
    return res.status(500).json({ status: "error", error: String((error && error.message) || error) });
  }
}
