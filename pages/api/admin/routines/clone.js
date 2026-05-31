import dbConnect from "@/utils/mongoose"
import mongoose from "mongoose"
import Rutina from "@/models/Rutina"
import Gym from "@/models/Gym"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]"
import { activeTenant } from "@/config/tenant"
import { tenants } from "@/config/tenants"

// ── Helpers de normalización ──────────────────────────────────────────────────
// Réplica EXACTA de la lógica de normalización de pages/api/admin/routines.js
// (normalizarEjercicio / normalizarRutina, formato nuevo) para regenerar
// diaId (`${_id}-dia-<i>`) y ejercicioId (`${_id}-<diaIndex>-<ejIndex>`)
// estables en el contexto del nuevo gym destino.

function parsePeso(p) {
  if (p === null || p === undefined) return null
  if (typeof p === "number") return Number.isNaN(p) ? null : p
  const cleaned = String(p).replace(/[^0-9.]/g, "")
  if (cleaned === "") return null
  const n = parseFloat(cleaned)
  return Number.isNaN(n) ? null : n
}

function parseUnidad(ej) {
  if (ej && (ej.unidadPeso === "kg" || ej.unidadPeso === "lb")) return ej.unidadPeso
  if (ej && /lb/i.test(String(ej.peso))) return "lb"
  return "kg"
}

function normalizarEjercicio(rutinaId, diaIndex, ej, ejIndex) {
  return {
    // Se regenera SIEMPRE para el nuevo _id (no se reusa el de la source).
    ejercicioId: `${rutinaId}-${diaIndex}-${ejIndex}`,
    nombre: ej.nombre ?? "",
    series: ej.series ?? 3,
    repeticiones: ej.repeticiones ?? 10,
    descanso: ej.descanso ?? 60,
    peso: parsePeso(ej.peso),
    unidadPeso: parseUnidad(ej),
    notas: ej.notas ?? "",
    orden: typeof ej.orden === "number" ? ej.orden : ejIndex,
  }
}

// Renormaliza los días-con-ejercicios de la source bajo el nuevo _id destino.
function normalizarDias(rutinaId, DIAS, DIAS_SEMANA) {
  const diasNorm = (Array.isArray(DIAS) ? DIAS : []).map((dia, diaIndex) => ({
    diaId: `${rutinaId}-dia-${diaIndex}`,
    nombre: dia.nombre || `Día ${diaIndex + 1}`,
    orden: typeof dia.orden === "number" ? dia.orden : diaIndex,
    ejercicios: (Array.isArray(dia.ejercicios) ? dia.ejercicios : []).map(
      (ej, ejIndex) => normalizarEjercicio(rutinaId, diaIndex, ej, ejIndex)
    ),
  }))

  const diasSemana = Array.isArray(DIAS_SEMANA)
    ? DIAS_SEMANA.map((d) => String(d).toLowerCase())
    : []

  return { DIAS: diasNorm, DIAS_SEMANA: diasSemana }
}

// Resuelve un GYM_ID (slug) a un nombre legible (estáticos primero, luego DB).
async function resolveGymName(slug) {
  if (!slug) return ""
  const t = tenants[slug]
  if (t) return t.name
  const gym = await Gym.findOne({ SLUG: slug }).select("NOMBRE").lean()
  return gym ? gym.NOMBRE : slug
}

// ── Fase 5.3: Marketplace — Clonar ────────────────────────────────────────────
// POST /api/admin/routines/clone  body: { sourceId }
// Copia una rutina COMPARTIDA de OTRO gym al gym propio creando una rutina nueva
// (ID auto-incrementado local, COMPARTIDA: false, atribución de origen).
export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  if (!session || !session.user.admin) {
    return res.status(401).json({ error: "No autorizado" })
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" })
  }

  await dbConnect()
  const GYM_ID = activeTenant.gymId

  try {
    const { sourceId } = req.body

    if (sourceId === undefined || sourceId === null || sourceId === "") {
      return res.status(400).json({ error: "Falta sourceId" })
    }

    // Buscar la source garantizando: compartida + de OTRO gym.
    const source = await Rutina.findOne({
      ID: sourceId,
      COMPARTIDA: true,
      GYM_ID: { $ne: GYM_ID },
    }).lean()

    if (!source) {
      return res
        .status(404)
        .json({ error: "Rutina no disponible para clonar" })
    }

    // Auto-incrementar ID en el gym destino (mismo patrón que routines.js POST).
    const lastRoutine = await Rutina.findOne({ GYM_ID }).sort({ ID: -1 })
    const newId = lastRoutine ? lastRoutine.ID + 1 : 1

    // _id por adelantado para diaId/ejercicioId estables prefijados por _id.
    const _id = new mongoose.Types.ObjectId()

    // Deep copy para romper referencias, luego renormalizar bajo el nuevo _id.
    const diasCopia = JSON.parse(JSON.stringify(source.DIAS || []))
    const { DIAS: diasNorm, DIAS_SEMANA: diasSemanaNorm } = normalizarDias(
      _id,
      diasCopia,
      source.DIAS_SEMANA
    )

    // Atribución del origen: nombre legible del gym que la creó.
    const origenNombre =
      source.ORIGEN_NOMBRE || (await resolveGymName(source.GYM_ID))

    const cloned = await Rutina.create({
      _id,
      ID: newId,
      GYM_ID, // SIEMPRE el destino (activeTenant.gymId)
      NOMBRE: source.NOMBRE,
      DESCRIPCION: source.DESCRIPCION,
      DIAS: diasNorm,
      DIAS_SEMANA: diasSemanaNorm,
      EJERCICIOS: [], // legacy: no se escribe (igual que routines.js POST)
      DURACION: source.DURACION,
      DIFICULTAD: source.DIFICULTAD,
      NIVEL: source.NIVEL,
      IMAGEN: source.IMAGEN || "",
      HABILITADA: true,
      COMPARTIDA: false, // el clon NO nace compartido
      ORIGEN_GYM: source.GYM_ID, // atribución: gym que la creó
      ORIGEN_NOMBRE: origenNombre,
      FECHA_CREACION: new Date(),
      FECHA_MODIFICACION: new Date(),
      USUARIO_CREACION: session.user.username,
      USUARIO_MODIFICACION: session.user.username,
    })

    return res.status(201).json(cloned)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
