import dbConnect from "@/utils/mongoose"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { activeTenant } from "@/config/tenant"
import Usuario from "@/models/Usuario"
import Record from "@/models/Record"
import WorkoutCompletado from "@/models/WorkoutCompletado"
import MetricaCorporal from "@/models/MetricaCorporal"

// 3.3 — Progreso por socio. Lectura agregada por DNI (sin escritura).
// GET /api/admin/progreso?dni=<DNI>[&desde=<ISO>&hasta=<ISO>]
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || !session.user.admin) {
    return res.status(401).json({ error: "No autorizado" })
  }

  await dbConnect()
  const GYM_ID = activeTenant.gymId

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" })
  }

  try {
    const { dni, desde, hasta } = req.query

    if (!dni) {
      return res.status(400).json({ error: "Falta el parámetro dni" })
    }

    const DNI = parseInt(dni)

    const usuario = await Usuario.findOne({ GYM_ID, DNI }).select("-PASSWORD")
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" })
    }

    // Filtro de rango opcional sobre FECHA.
    const rangoFecha = {}
    if (desde) rangoFecha.$gte = new Date(desde)
    if (hasta) rangoFecha.$lte = new Date(hasta)
    const hasRango = Object.keys(rangoFecha).length > 0

    const baseQuery = { GYM_ID, DNI }
    const query = hasRango ? { ...baseQuery, FECHA: rangoFecha } : baseQuery

    const [records, workouts, metricas] = await Promise.all([
      Record.find(query).sort({ FECHA: -1 }),
      WorkoutCompletado.find(query).sort({ FECHA: -1 }),
      MetricaCorporal.find(query).sort({ FECHA: 1 }), // cronológico para gráficos
    ])

    return res.status(200).json({
      usuario: {
        DNI: usuario.DNI,
        NOMBRE: usuario.NOMBRE,
        APELLIDO: usuario.APELLIDO,
        EMAIL: usuario.EMAIL,
      },
      records,
      workouts,
      metricas,
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
