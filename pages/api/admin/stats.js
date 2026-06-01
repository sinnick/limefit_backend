import dbConnect from "@/utils/mongoose"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { activeTenant } from "@/config/tenant"
import Usuario from "@/models/Usuario"
import Asistencia from "@/models/Asistencia"
import UsuarioRutina from "@/models/UsuarioRutina"
import Rutina from "@/models/Rutina"
import WorkoutCompletado from "@/models/WorkoutCompletado"

// Agregados de dashboard (CONTRACT-fase3 §1.4 / 3.5).
// GET /api/admin/stats -> series listas para recharts ({ label, value }[]).
// Una sola llamada con todas las métricas (evita 4 requests desde el dashboard).

// Etiqueta "YYYY-MM" de una fecha (UTC) sin dependencias externas.
function monthKey(date) {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}

// Construye los últimos `n` meses (incl. el actual) en orden cronológico.
function lastMonths(n) {
  const out = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
    out.push(monthKey(d))
  }
  return out
}

// Construye las últimas `n` semanas (incl. la actual) en orden cronológico.
// Devuelve { inicio: Date }[] donde cada semana arranca `i` semanas atrás
// respecto al inicio (medianoche UTC) de la semana actual.
function lastWeeks(n) {
  const out = []
  const now = new Date()
  // Inicio de la semana actual (lunes) en UTC.
  const day = now.getUTCDay() // 0=domingo..6=sabado
  const diffToMonday = (day + 6) % 7
  const startOfWeek = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  startOfWeek.setUTCDate(startOfWeek.getUTCDate() - diffToMonday)
  for (let i = n - 1; i >= 0; i--) {
    const inicio = new Date(startOfWeek)
    inicio.setUTCDate(inicio.getUTCDate() - i * 7)
    out.push(inicio)
  }
  return out
}

// Distribuye fechas en las `n` semanas dadas, devolviendo { label, value }[].
function bucketByWeek(fechas, weeks) {
  const counts = new Array(weeks.length).fill(0)
  const horizonte = new Date(weeks[0])
  for (const f of fechas) {
    const fecha = new Date(f)
    if (fecha < horizonte) continue
    // índice de semana: cuántas semanas desde el inicio del horizonte
    const idx = Math.floor((fecha - horizonte) / (7 * 24 * 60 * 60 * 1000))
    if (idx >= 0 && idx < counts.length) counts[idx]++
  }
  return counts.map((value, i) => ({ label: `Sem ${i + 1}`, value }))
}

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
    const meses = lastMonths(12)
    const semanas = lastWeeks(8)
    const desdeMeses = new Date(`${meses[0]}-01T00:00:00.000Z`)
    const desdeSemanas = semanas[0]

    // --- altasPorMes: Usuario.FECHA_CREACION, últimos 12 meses ---
    const altasAgg = await Usuario.aggregate([
      { $match: { GYM_ID, FECHA_CREACION: { $gte: desdeMeses } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$FECHA_CREACION" } },
          value: { $sum: 1 },
        },
      },
    ])
    const altasMap = new Map(altasAgg.map((d) => [d._id, d.value]))
    const altasPorMes = meses.map((label) => ({ label, value: altasMap.get(label) || 0 }))

    // --- asistenciasPorSemana: Asistencia.FECHA, últimas ~8 semanas ---
    const asistenciasDocs = await Asistencia.find(
      { GYM_ID, FECHA: { $gte: desdeSemanas } },
      { FECHA: 1, _id: 0 }
    ).lean()
    const asistenciasPorSemana = bucketByWeek(
      asistenciasDocs.map((a) => a.FECHA),
      semanas
    )

    // --- workoutsPorSemana: WorkoutCompletado.FECHA, últimas ~8 semanas ---
    const workoutDocs = await WorkoutCompletado.find(
      { GYM_ID, FECHA: { $gte: desdeSemanas } },
      { FECHA: 1, _id: 0 }
    ).lean()
    const workoutsPorSemana = bucketByWeek(
      workoutDocs.map((w) => w.FECHA),
      semanas
    )

    // --- rutinasTop: UsuarioRutina ACTIVA agrupado por RUTINA_ID (top 5) ---
    const topAgg = await UsuarioRutina.aggregate([
      { $match: { GYM_ID, ACTIVA: true } },
      { $group: { _id: "$RUTINA_ID", value: { $sum: 1 } } },
      { $sort: { value: -1 } },
      { $limit: 5 },
    ])
    // Manual populate del nombre de la rutina (por su campo ID, no _id).
    const rutinaIds = topAgg.map((t) => t._id)
    const rutinas = await Rutina.find(
      { GYM_ID, ID: { $in: rutinaIds } },
      { ID: 1, NOMBRE: 1, _id: 0 }
    ).lean()
    const nombreMap = new Map(rutinas.map((r) => [r.ID, r.NOMBRE]))
    const rutinasTop = topAgg.map((t) => ({
      label: nombreMap.get(t._id) || `Rutina ${t._id}`,
      value: t.value,
    }))

    // --- prsEsteMes: sum(PRS_LOGRADOS) de WorkoutCompletado del mes actual ---
    const now = new Date()
    const inicioMes = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const prsAgg = await WorkoutCompletado.aggregate([
      { $match: { GYM_ID, FECHA: { $gte: inicioMes } } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$PRS_LOGRADOS", 0] } } } },
    ])
    const prsEsteMes = prsAgg.length > 0 ? prsAgg[0].total : 0

    return res.status(200).json({
      altasPorMes,
      asistenciasPorSemana,
      rutinasTop,
      prsEsteMes,
      workoutsPorSemana,
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
