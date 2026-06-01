import dbConnect from "@/utils/mongoose"
import Asistencia from "@/models/Asistencia"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]"
import { activeTenant } from "@/config/tenant"
import { puede } from "@/utils/permisos"

// 4.2 — Aforo actual (hoy). Aprovecha Asistencia (1 check-in por DNI+gym+día).
// GET /api/admin/acceso/aforo?capacidad=
// ocupacion = check-ins del día de hoy (proxy de aforo; Asistencia no modela check-out).
// capacidad: param ?capacidad= o activeTenant.aforoMax; si no hay → null.
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || !session.user.admin) {
    return res.status(401).json({ error: "No autorizado" })
  }
  if (!puede(session, "acceso")) {
    return res.status(403).json({ error: "Sin permiso para ver acceso" })
  }

  await dbConnect()
  const GYM_ID = activeTenant.gymId

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" })
  }

  try {
    // Medianoche UTC de hoy (mismo criterio que Asistencia.FECHA).
    const ahora = new Date()
    const hoyMedianocheUTC = new Date(
      Date.UTC(
        ahora.getUTCFullYear(),
        ahora.getUTCMonth(),
        ahora.getUTCDate()
      )
    )

    const ocupacion = await Asistencia.countDocuments({
      GYM_ID,
      FECHA: hoyMedianocheUTC,
    })

    // Resolver capacidad: param explícito > config del tenant > null.
    let capacidad = null
    const { capacidad: capParam } = req.query
    if (capParam !== undefined && `${capParam}`.trim() !== "") {
      const c = parseInt(capParam)
      if (!isNaN(c) && c > 0) capacidad = c
    } else if (activeTenant.aforoMax) {
      const c = parseInt(activeTenant.aforoMax)
      if (!isNaN(c) && c > 0) capacidad = c
    }

    const porcentaje = capacidad
      ? Math.round((ocupacion / capacidad) * 100)
      : null

    return res.status(200).json({ ocupacion, capacidad, porcentaje })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
