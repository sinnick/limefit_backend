import dbConnect from "@/utils/mongoose"
import Clase from "@/models/Clase"
import Reserva from "@/models/Reserva"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { activeTenant } from "@/config/tenant"
import { puede } from "@/utils/permisos"

// CRUD de clases grupales (CONTRACT-fase4.md §1.3 / §2.4 / Feature 4.3).
// Requiere session.user.admin (puerta del panel) y, de forma ADITIVA, la
// capacidad "clases" del ROL (dueno/admin/entrenador). Filtra por GYM_ID.
// Unicidad (GYM_ID, NOMBRE, DIA_SEMANA, HORA). GET anexa cupoOcupado del
// próximo dictado (§4.3).

const DIAS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"]

// Medianoche UTC del próximo dictado de una clase (incluye hoy).
function proximoDictadoUTC(diaSemana) {
  const target = DIAS.indexOf(diaSemana)
  const hoy = new Date()
  const base = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()))
  if (target < 0) return base
  const diff = (target - base.getUTCDay() + 7) % 7
  return new Date(base.getTime() + diff * 24 * 60 * 60 * 1000)
}

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  if (!session || !session.user.admin) {
    return res.status(401).json({ error: "No autorizado" })
  }

  await dbConnect()
  const GYM_ID = activeTenant.gymId

  if (req.method === "GET") {
    try {
      if (!puede(session, "clases")) {
        return res.status(403).json({ error: "Sin permiso para ver clases" })
      }

      const { q, dia, activa } = req.query
      const query = { GYM_ID }

      if (q && q.trim() !== "") {
        query.NOMBRE = { $regex: q.trim(), $options: "i" }
      }
      if (dia && dia.trim() !== "") query.DIA_SEMANA = dia
      if (activa === "true") query.ACTIVA = true
      if (activa === "false") query.ACTIVA = false

      const clases = await Clase.find(query).sort({ DIA_SEMANA: 1, HORA: 1 })

      const enriched = await Promise.all(
        clases.map(async (clase) => {
          const fecha = proximoDictadoUTC(clase.DIA_SEMANA)
          const cupoOcupado = await Reserva.countDocuments({
            GYM_ID,
            CLASE_ID: clase._id,
            FECHA: fecha,
            ESTADO: "reservada",
          })
          return {
            ...clase.toObject(),
            cupoOcupado,
            cupoDisponible: clase.CUPO - cupoOcupado,
            proximoDictado: fecha,
          }
        })
      )

      return res.status(200).json(enriched)
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === "POST") {
    try {
      if (!puede(session, "clases")) {
        return res.status(403).json({ error: "Sin permiso para crear clases" })
      }

      const { NOMBRE, INSTRUCTOR, DIA_SEMANA, HORA, CUPO, ACTIVA } = req.body

      if (!NOMBRE || !INSTRUCTOR || !DIA_SEMANA || !HORA || CUPO === undefined || CUPO === null) {
        return res.status(400).json({
          error: "NOMBRE, INSTRUCTOR, DIA_SEMANA, HORA y CUPO son obligatorios",
        })
      }

      const existing = await Clase.findOne({ GYM_ID, NOMBRE, DIA_SEMANA, HORA })
      if (existing) {
        return res.status(400).json({ error: "Ya existe una clase con ese nombre en ese día y hora" })
      }

      const nueva = await Clase.create({
        NOMBRE,
        INSTRUCTOR,
        DIA_SEMANA,
        HORA,
        CUPO,
        ACTIVA: ACTIVA !== undefined ? ACTIVA : true,
        GYM_ID,
        FECHA_CREACION: new Date(),
      })

      return res.status(201).json(nueva)
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === "PUT") {
    try {
      if (!puede(session, "clases")) {
        return res.status(403).json({ error: "Sin permiso para editar clases" })
      }

      const { _id, NOMBRE, INSTRUCTOR, DIA_SEMANA, HORA, CUPO, ACTIVA } = req.body

      if (!_id) {
        return res.status(400).json({ error: "Falta _id" })
      }

      const clase = await Clase.findOne({ _id, GYM_ID })
      if (!clase) {
        return res.status(404).json({ error: "Clase no encontrada" })
      }

      // Revalidar unicidad si cambia alguna parte de la llave (NOMBRE/DIA/HORA).
      const nuevoNombre = NOMBRE !== undefined ? NOMBRE : clase.NOMBRE
      const nuevoDia = DIA_SEMANA !== undefined ? DIA_SEMANA : clase.DIA_SEMANA
      const nuevaHora = HORA !== undefined ? HORA : clase.HORA
      if (
        nuevoNombre !== clase.NOMBRE ||
        nuevoDia !== clase.DIA_SEMANA ||
        nuevaHora !== clase.HORA
      ) {
        const dup = await Clase.findOne({
          GYM_ID,
          NOMBRE: nuevoNombre,
          DIA_SEMANA: nuevoDia,
          HORA: nuevaHora,
          _id: { $ne: _id },
        })
        if (dup) {
          return res.status(400).json({ error: "Ya existe una clase con ese nombre en ese día y hora" })
        }
      }

      const updateData = { FECHA_MODIFICACION: new Date() }
      if (NOMBRE !== undefined) updateData.NOMBRE = NOMBRE
      if (INSTRUCTOR !== undefined) updateData.INSTRUCTOR = INSTRUCTOR
      if (DIA_SEMANA !== undefined) updateData.DIA_SEMANA = DIA_SEMANA
      if (HORA !== undefined) updateData.HORA = HORA
      if (CUPO !== undefined) updateData.CUPO = CUPO
      if (ACTIVA !== undefined) updateData.ACTIVA = ACTIVA

      const actualizada = await Clase.findOneAndUpdate({ _id, GYM_ID }, updateData, { new: true })

      return res.status(200).json(actualizada)
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === "DELETE") {
    try {
      if (!puede(session, "clases")) {
        return res.status(403).json({ error: "Sin permiso para eliminar clases" })
      }

      const { id } = req.query
      if (!id) {
        return res.status(400).json({ error: "Falta id" })
      }

      const eliminada = await Clase.findOneAndDelete({ _id: id, GYM_ID })
      if (!eliminada) {
        return res.status(404).json({ error: "Clase no encontrada" })
      }

      return res.status(200).json({ message: "Clase eliminada" })
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: "Método no permitido" })
}
