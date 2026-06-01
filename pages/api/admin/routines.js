import dbConnect from "@/utils/mongoose"
import mongoose from "mongoose"
import Rutina from "@/models/Rutina"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { activeTenant } from "@/config/tenant"

// ── Helpers de transformación (CONTRACT-fase0.md §a / MIGRATION-fase0.md §3) ──
// Mantienen el MISMO contrato que scripts/migrate-rutinas.js para que la escritura
// admin produzca documentos idénticos a los migrados.

// parsePeso: String|Number|null → Number | null.
//   "20kg" -> 20, "20" -> 20, "bodyweight" -> null, "" -> null, null -> null.
function parsePeso(p) {
  if (p === null || p === undefined) return null
  if (typeof p === "number") return Number.isNaN(p) ? null : p
  const cleaned = String(p).replace(/[^0-9.]/g, "")
  if (cleaned === "") return null
  const n = parseFloat(cleaned)
  return Number.isNaN(n) ? null : n
}

// parseUnidad: si el valor contiene "lb" → "lb"; en otro caso → "kg".
// Respeta una unidadPeso explícita si ya viene en el ejercicio.
function parseUnidad(ej) {
  if (ej && (ej.unidadPeso === "kg" || ej.unidadPeso === "lb")) return ej.unidadPeso
  if (ej && /lb/i.test(String(ej.peso))) return "lb"
  return "kg"
}

// ¿`DIAS` viene ya en el formato nuevo (array de días-con-ejercicios)?
// Nuevo: array de objetos. Legacy: array de strings (días de la semana) o vacío.
function esFormatoNuevo(DIAS) {
  return (
    Array.isArray(DIAS) &&
    DIAS.length > 0 &&
    typeof DIAS[0] === "object" &&
    DIAS[0] !== null
  )
}

// Normaliza un ejercicio (de cualquier origen) al subdocumento del modelo nuevo,
// generando ejercicioId/orden estables cuando falten.
function normalizarEjercicio(rutinaId, diaIndex, ej, ejIndex) {
  return {
    ejercicioId: ej.ejercicioId || `${rutinaId}-${diaIndex}-${ejIndex}`,
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

// Construye { DIAS, DIAS_SEMANA } del modelo nuevo a partir del body, aceptando
// tanto el formato nuevo (DIAS anidado) como el legacy (EJERCICIOS[] + DIAS de
// días-de-semana). MIGRATION-fase0.md §7: la UI admin todavía manda legacy; el
// server normaliza al modelo nuevo (un único día "Día 1").
function normalizarRutina(rutinaId, { DIAS, EJERCICIOS, DIAS_SEMANA }) {
  // Caso A: ya llega el formato nuevo (días-con-ejercicios anidados).
  if (esFormatoNuevo(DIAS)) {
    const diasNorm = DIAS.map((dia, diaIndex) => ({
      diaId: dia.diaId || `${rutinaId}-dia-${diaIndex}`,
      nombre: dia.nombre || `Día ${diaIndex + 1}`,
      orden: typeof dia.orden === "number" ? dia.orden : diaIndex,
      ejercicios: (Array.isArray(dia.ejercicios) ? dia.ejercicios : []).map(
        (ej, ejIndex) => normalizarEjercicio(rutinaId, diaIndex, ej, ejIndex)
      ),
    }))

    // DIAS_SEMANA explícito si vino; si no, se preserva vacío.
    const diasSemana = Array.isArray(DIAS_SEMANA)
      ? DIAS_SEMANA.map((d) => String(d).toLowerCase())
      : []

    return { DIAS: diasNorm, DIAS_SEMANA: diasSemana }
  }

  // Caso B: formato legacy. DIAS (si viene) son días de la semana → DIAS_SEMANA.
  // Los EJERCICIOS[] del bloque único pasan a un único día "Día 1".
  const diasSemanaRaw = Array.isArray(DIAS_SEMANA)
    ? DIAS_SEMANA
    : Array.isArray(DIAS)
    ? DIAS
    : []
  const diasSemana = diasSemanaRaw.map((d) => String(d).toLowerCase())

  const ejerciciosLegacy = Array.isArray(EJERCICIOS) ? EJERCICIOS : []
  let diasNorm = []
  if (ejerciciosLegacy.length > 0) {
    diasNorm = [
      {
        diaId: `${rutinaId}-dia-0`,
        nombre: "Día 1",
        orden: 0,
        ejercicios: ejerciciosLegacy.map((ej, ejIndex) =>
          normalizarEjercicio(rutinaId, 0, ej, ejIndex)
        ),
      },
    ]
  }

  return { DIAS: diasNorm, DIAS_SEMANA: diasSemana }
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  // Check if user is authenticated and is admin
  if (!session || !session.user.admin) {
    return res.status(401).json({ error: "No autorizado" })
  }

  await dbConnect()
  const GYM_ID = activeTenant.gymId

  if (req.method === "GET") {
    try {
      const routines = await Rutina.find({ GYM_ID }).sort({ FECHA_CREACION: -1 })
      return res.status(200).json(routines)
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === "POST") {
    try {
      const {
        NOMBRE,
        DESCRIPCION,
        DIAS,
        EJERCICIOS,
        DIAS_SEMANA,
        DURACION,
        DIFICULTAD,
        IMAGEN,
        NIVEL
      } = req.body

      // Get the highest ID and increment (scoped to tenant)
      const lastRoutine = await Rutina.findOne({ GYM_ID }).sort({ ID: -1 })
      const newId = lastRoutine ? lastRoutine.ID + 1 : 1

      // Generar el _id por adelantado para que diaId/ejercicioId sean estables y
      // prefijados por el _id (misma convención que la migración: `${_id}-dia-0`).
      const _id = new mongoose.Types.ObjectId()
      const { DIAS: diasNorm, DIAS_SEMANA: diasSemanaNorm } = normalizarRutina(
        _id,
        { DIAS, EJERCICIOS, DIAS_SEMANA }
      )

      const newRoutine = await Rutina.create({
        _id,
        ID: newId,
        GYM_ID,
        NOMBRE,
        DESCRIPCION,
        DIAS: diasNorm,
        DIAS_SEMANA: diasSemanaNorm,
        EJERCICIOS: [], // legacy: ya no se escribe (CONTRACT-fase0.md §a.1)
        HABILITADA: true,
        FECHA_CREACION: new Date(),
        FECHA_MODIFICACION: new Date(),
        USUARIO_CREACION: session.user.username,
        USUARIO_MODIFICACION: session.user.username,
        DURACION,
        DIFICULTAD,
        IMAGEN: IMAGEN || "",
        NIVEL
      })

      return res.status(201).json(newRoutine)
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === "PUT") {
    try {
      const {
        ID,
        NOMBRE,
        DESCRIPCION,
        DIAS,
        EJERCICIOS,
        DIAS_SEMANA,
        DURACION,
        DIFICULTAD,
        IMAGEN,
        NIVEL,
        HABILITADA
      } = req.body

      // Necesitamos el _id real para generar diaId/ejercicioId estables al
      // normalizar (mismos que produciría la migración).
      const existing = await Rutina.findOne({ ID, GYM_ID })
      if (!existing) {
        return res.status(404).json({ error: "Rutina no encontrada" })
      }

      const { DIAS: diasNorm, DIAS_SEMANA: diasSemanaNorm } = normalizarRutina(
        existing._id,
        { DIAS, EJERCICIOS, DIAS_SEMANA }
      )

      const updatedRoutine = await Rutina.findOneAndUpdate(
        { ID, GYM_ID },
        {
          NOMBRE,
          DESCRIPCION,
          DIAS: diasNorm,
          DIAS_SEMANA: diasSemanaNorm,
          EJERCICIOS: [], // legacy: ya no se escribe
          DURACION,
          DIFICULTAD,
          IMAGEN,
          NIVEL,
          HABILITADA,
          FECHA_MODIFICACION: new Date(),
          USUARIO_MODIFICACION: session.user.username
        },
        { new: true }
      )

      if (!updatedRoutine) {
        return res.status(404).json({ error: "Rutina no encontrada" })
      }

      return res.status(200).json(updatedRoutine)
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === "DELETE") {
    try {
      // La UI admin (pages/admin/routines.jsx) borra con { _id } en el body.
      // Se acepta además id/ID por query string para compatibilidad.
      const _id = req.body?._id
      const idQuery = req.query.id ?? req.query.ID

      let deletedRoutine = null
      if (_id) {
        deletedRoutine = await Rutina.findOneAndDelete({ _id, GYM_ID })
      } else if (idQuery !== undefined) {
        deletedRoutine = await Rutina.findOneAndDelete({
          ID: parseInt(idQuery),
          GYM_ID
        })
      } else {
        return res.status(400).json({ error: "Falta el identificador de la rutina" })
      }

      if (!deletedRoutine) {
        return res.status(404).json({ error: "Rutina no encontrada" })
      }

      return res.status(200).json({ message: "Rutina eliminada" })
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: "Método no permitido" })
}
