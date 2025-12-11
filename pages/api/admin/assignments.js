import dbConnect from "@/utils/mongoose"
import UsuarioRutina from "@/models/UsuarioRutina"
import Usuario from "@/models/Usuario"
import Rutina from "@/models/Rutina"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions)

  // Check if user is authenticated and is admin
  if (!session || !session.user.admin) {
    return res.status(401).json({ error: "No autorizado" })
  }

  await dbConnect()

  if (req.method === "GET") {
    try {
      const { dni } = req.query

      let query = {}
      if (dni) {
        query.DNI = parseInt(dni)
      }

      const assignments = await UsuarioRutina.find(query).sort({ FECHA_ASIGNACION: -1 })

      // Populate with user and routine data
      const enrichedAssignments = await Promise.all(
        assignments.map(async (assignment) => {
          const user = await Usuario.findOne({ DNI: assignment.DNI }).select('DNI NOMBRE APELLIDO EMAIL')
          const routine = await Rutina.findOne({ ID: assignment.RUTINA_ID }).select('ID NOMBRE DESCRIPCION NIVEL')

          return {
            ...assignment.toObject(),
            usuario: user,
            rutina: routine
          }
        })
      )

      return res.status(200).json(enrichedAssignments)
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === "POST") {
    try {
      const { DNI, RUTINA_ID, NOTAS, FECHA_INICIO, FECHA_FIN } = req.body

      // Verify user exists
      const user = await Usuario.findOne({ DNI })
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" })
      }

      // Verify routine exists
      const routine = await Rutina.findOne({ ID: RUTINA_ID })
      if (!routine) {
        return res.status(404).json({ error: "Rutina no encontrada" })
      }

      // Check if active assignment already exists
      const existingAssignment = await UsuarioRutina.findOne({
        DNI,
        RUTINA_ID,
        ACTIVA: true
      })

      if (existingAssignment) {
        return res.status(400).json({ error: "El usuario ya tiene esta rutina asignada activamente" })
      }

      const newAssignment = await UsuarioRutina.create({
        DNI,
        RUTINA_ID,
        ASIGNADO_POR: session.user.username,
        ACTIVA: true,
        FECHA_ASIGNACION: new Date(),
        FECHA_INICIO: FECHA_INICIO || new Date(),
        FECHA_FIN: FECHA_FIN || null,
        NOTAS: NOTAS || ""
      })

      return res.status(201).json(newAssignment)
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === "PUT") {
    try {
      const { id, ACTIVA, FECHA_FIN, NOTAS } = req.body

      const updatedAssignment = await UsuarioRutina.findByIdAndUpdate(
        id,
        {
          ACTIVA,
          FECHA_FIN,
          NOTAS
        },
        { new: true }
      )

      if (!updatedAssignment) {
        return res.status(404).json({ error: "Asignación no encontrada" })
      }

      return res.status(200).json(updatedAssignment)
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === "DELETE") {
    try {
      const { id } = req.query

      const deletedAssignment = await UsuarioRutina.findByIdAndDelete(id)

      if (!deletedAssignment) {
        return res.status(404).json({ error: "Asignación no encontrada" })
      }

      return res.status(200).json({ message: "Asignación eliminada" })
    } catch (error) {
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: "Método no permitido" })
}
