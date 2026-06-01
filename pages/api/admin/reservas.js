import dbConnect from "@/utils/mongoose"
import Reserva from "@/models/Reserva"
import Clase from "@/models/Clase"
import Usuario from "@/models/Usuario"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { activeTenant } from "@/config/tenant"
import { puede } from "@/utils/permisos"

// Ver reservas desde el admin (CONTRACT-fase4.md §2.5 / Feature 4.3).
// SOLO lectura: el admin NO crea reservas (eso es móvil del socio). Requiere
// session.user.admin + capacidad "reservas_ver". Anexa NOMBRE/APELLIDO del
// socio y datos de la clase. Filtra por GYM_ID.
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  if (!session || !session.user.admin) {
    return res.status(401).json({ error: "No autorizado" })
  }

  await dbConnect()
  const GYM_ID = activeTenant.gymId

  if (req.method === "GET") {
    try {
      if (!puede(session, "reservas_ver")) {
        return res.status(403).json({ error: "Sin permiso para ver reservas" })
      }

      const { claseId, dni, fecha } = req.query
      const query = { GYM_ID, ESTADO: "reservada" }

      if (claseId) query.CLASE_ID = claseId
      if (dni) query.DNI = parseInt(dni)
      if (fecha) {
        const d = new Date(fecha)
        query.FECHA = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
      }

      const reservas = await Reserva.find(query).sort({ FECHA: -1 })

      const enriched = await Promise.all(
        reservas.map(async (reserva) => {
          const usuario = await Usuario.findOne({ DNI: reserva.DNI, GYM_ID }).select(
            "DNI NOMBRE APELLIDO"
          )
          const clase = await Clase.findOne({ _id: reserva.CLASE_ID, GYM_ID }).select(
            "NOMBRE INSTRUCTOR DIA_SEMANA HORA CUPO"
          )
          return {
            ...reserva.toObject(),
            usuario,
            clase,
          }
        })
      )

      return res.status(200).json(enriched)
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: "Método no permitido" })
}
