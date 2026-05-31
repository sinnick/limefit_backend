import dbConnect from "@/utils/mongoose"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { activeTenant } from "@/config/tenant"
import UsuarioRutina from "@/models/UsuarioRutina"
import Rutina from "@/models/Rutina"
import WorkoutCompletado from "@/models/WorkoutCompletado"

// 3.6 — Adherencia por socio. % de cumplimiento de rutinas asignadas activas.
// GET /api/admin/adherencia?dni=<DNI>
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
    const { dni } = req.query
    if (!dni) {
      return res.status(400).json({ error: "Falta el parámetro dni" })
    }

    const DNI = parseInt(dni)
    const ahora = new Date()
    const MS_POR_SEMANA = 7 * 24 * 60 * 60 * 1000

    const asignaciones = await UsuarioRutina.find({ GYM_ID, DNI, ACTIVA: true })

    const porRutina = []
    let totalEsperados = 0
    let totalCompletados = 0

    for (const asignacion of asignaciones) {
      const rutina = await Rutina.findOne({ GYM_ID, ID: asignacion.RUTINA_ID })

      const diasSemana = rutina?.DIAS_SEMANA?.length || 0
      const diasRutina = rutina?.DIAS?.length || 0
      const diasPorSemana = diasSemana || diasRutina || 0

      const fechaInicio = asignacion.FECHA_INICIO || asignacion.FECHA_ASIGNACION
      const semanas = Math.max(
        1,
        Math.ceil((ahora - new Date(fechaInicio)) / MS_POR_SEMANA)
      )
      const esperados = semanas * diasPorSemana

      const completados = await WorkoutCompletado.countDocuments({
        GYM_ID,
        DNI,
        FECHA: { $gte: new Date(fechaInicio) },
      })

      const porcentaje =
        esperados > 0
          ? Math.round(Math.min(100, (completados / esperados) * 100))
          : 0

      porRutina.push({
        RUTINA_ID: asignacion.RUTINA_ID,
        RUTINA_NOMBRE: rutina?.NOMBRE || `Rutina ${asignacion.RUTINA_ID}`,
        FECHA_INICIO: fechaInicio,
        diasPorSemana,
        esperados,
        completados,
        porcentaje,
      })

      totalEsperados += esperados
      totalCompletados += completados
    }

    const porcentajeGlobal =
      totalEsperados > 0
        ? Math.round(Math.min(100, (totalCompletados / totalEsperados) * 100))
        : 0

    return res.status(200).json({
      dni: DNI,
      global: {
        esperados: totalEsperados,
        completados: totalCompletados,
        porcentaje: porcentajeGlobal,
      },
      porRutina,
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
